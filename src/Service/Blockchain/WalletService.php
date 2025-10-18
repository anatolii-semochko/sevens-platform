<?php

namespace App\Service\Blockchain;

use App\Entity\Wallet\WalletMessageSignature;
use App\Entity\Wallet\WalletTransaction;
use App\Repository\Wallet\WalletTransactionRepository;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

readonly class WalletService
{
    public function __construct(
        private EntityManagerInterface $em,
        private NodeServerApiClient $nodeServerApiClient,
        private WalletTransactionRepository $walletTransactionRepository,
    ) {}

    public function verifyWalletSignature(WalletMessageSignature $walletSignature): void
    {
        try {
            $response = $this->nodeServerApiClient->validateSignature(
                $walletSignature->getWalletPublicKey(),
                $walletSignature->getSignature(),
                $walletSignature->geNonce(),
            );

            if (!isset($response['success']) || !$response['success']) {
                throw new InvalidArgumentException('Authentication failed');
            }

            if (!isset($response['data']['authenticated']) || !$response['data']['authenticated']) {
                throw new InvalidArgumentException('Wallet not authenticated');
            }
        } catch (\Throwable $e) {
            throw new InvalidArgumentException('Wallet signature verification failed.');
        }
    }

    public function getSignatureFromArray(?array $data): ?WalletMessageSignature
    {
        if (!$data) {
            return null;
        }

        if (empty($data['walletPublicKey'])) {
            throw new \InvalidArgumentException('Wallet public key not specified.');
        }
        if (empty($data['nonce'])) {
            throw new \InvalidArgumentException('Wallet nonce not specified.');
        }
        if (empty($data['message'])) {
            throw new \InvalidArgumentException('Wallet message not specified.');
        }
        if (empty($data['signature'])) {
            throw new \InvalidArgumentException('Wallet signature not specified.');
        }

        return new WalletMessageSignature($data['walletPublicKey'], $data['nonce'], $data['message'], $data['signature']);
    }

    public function saveTransaction(string $transaction): string
    {
        $walletTransaction = new WalletTransaction();
        $walletTransaction->setTransaction($transaction);
        $this->em->persist($walletTransaction);
        $this->em->flush();

        return $walletTransaction->getId();
    }

    /**
     * @throws NodeServerApiException
     */
    public function matchTransactionSignature(string $transactionId, string $txSignature): void
    {
        $transaction = $this->walletTransactionRepository->get($transactionId);
        try {
            $this->nodeServerApiClient->matchTransactionAndSignature($transaction->getTransaction(), $txSignature);
            $this->em->remove($transaction);
        } catch (NodeServerApiException $e) {
            $transaction->setError($e->getMessage());
            $transaction->setUsedAt(new \DateTime());
            $this->em->persist($transaction);
            $this->em->flush();
            throw new NodeServerApiException($e->getMessage());
        }
    }
}
