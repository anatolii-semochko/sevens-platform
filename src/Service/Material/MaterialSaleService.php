<?php

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Repository\Material\MaterialSaleHistoryRepository;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\ORM\EntityManagerInterface;

readonly class MaterialSaleService
{
    public function __construct(
        private EntityManagerInterface $em,
        private NodeServerApiClient $nodeServerApiClient,
        private MaterialSaleHistoryRepository $materialSaleHistoryRepository,
    ) {}

    /**
     * @throws NodeServerApiException
     */
    public function refresh(Material $material): void
    {
        $tokenData = $this->nodeServerApiClient->getTokenMetadata($material->getToken())['data'];
        $tokenPrice = $tokenData['sale']['priceSevens'];
        $tokenPublicKey = $tokenData['tokenPublicKey'];
        $walletPublicKey = $tokenData['walletPublicKey'];

        if (!$material->getWallet()) {
            $material->setWallet($walletPublicKey);
            $this->em->persist($material);
            $this->em->flush();
        } elseif ($material->getWallet() !== $walletPublicKey) {
            $material->setNewWallet($walletPublicKey);
            $material->setActive(false);
            $this->em->persist($material);
            $this->em->flush();
            $this->materialSaleHistoryRepository->createEntry($tokenPublicKey, $walletPublicKey, null);
        }

        if ($material->getPrice() !== $tokenPrice) {
            $material->setPrice($tokenPrice);
            $this->em->persist($material);
            $this->em->flush();
            $this->materialSaleHistoryRepository->createEntry($tokenPublicKey, $walletPublicKey, $tokenPrice);
        }
    }
}
