<?php

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Entity\Token\SevensTokenContainer;
use App\Entity\Wallet\WalletMessageSignature;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialCommentRepository;
use App\Repository\Material\MaterialRepository;
use App\Repository\Token\TokenRepository;
use App\Service\Blockchain\TokenService;
use App\Service\Blockchain\WalletService;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

readonly class MaterialService
{
    public function __construct(
        private EntityManagerInterface $em,
        private MaterialRepository $repository,
        private MaterialCommentRepository $materialCommentRepository,
        private TokenRepository $tokenRepository,
        private TokenService $tokenService,
        private WalletService $walletService,
    ) {}

    public function fetch(): array
    {
        return $this->repository->findBy([]);
    }

    public function findByTokenPublicKey(string $tokenPublicKey): ?Material
    {
        return $this->repository->findOneBy(['token' => $tokenPublicKey]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function create(
        UserInterface $user,
        string $tokenPublicKey,
        SevensTokenContainer $sevensTokenContainer,
        ?WalletMessageSignature $walletMessageSignature,
    ): void {
        // Get token data from blockchain
        $sevensToken = $this->tokenRepository->get($tokenPublicKey);
        // Check if user owns the token
        $this->tokenService->checkUserPermissionToPublishMaterial($sevensToken, $walletMessageSignature);
        // Create material
        $material = new Material();
        $material->setToken($tokenPublicKey);
        $material->setTitle('');
        $material->setDescription('');
        $material->setTokenData($sevensToken);
        $material->setTokenContainer($sevensTokenContainer);
        $material->setLogo('');
        $material->setCreatedAt(new \DateTime());
        $material->setUpdatedAt(new \DateTime());
        $material->setUser($user);
        $this->em->persist($material);
        $this->em->flush();
    }

    public function getHighestRated(int $limit = 10, ?string $excludeToken = null): array
    {
        $qb = $this->repository->createQueryBuilder('m')
            ->where('m.viewCount > 0')
            ->orderBy('m.viewCount', 'DESC');

        if ($excludeToken) {
            $qb->andWhere('m.token != :excludeToken')
               ->setParameter('excludeToken', $excludeToken);
        }

        return $qb->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function save(Material $material): void
    {
        $this->em->persist($material);
        $this->em->flush();
    }

    public function getByPublisher(Material $material, int $limit = 10): array
    {
        return $this->repository->createQueryBuilder('m')
            ->where('m.user = :author')
            ->andWhere('m.token != :currentToken')
            ->setParameter('author', $material->getUser())
            ->setParameter('currentToken', $material->getToken())
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getNewest(int $limit = 50): array
    {
        return $this->repository->createQueryBuilder('m')
            ->orderBy('m.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getByPriceLowToHigh(int $limit = 50): array
    {
        return $this->repository->createQueryBuilder('m')
            ->where('m.price IS NOT NULL')
            ->orderBy('m.price', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function getByPriceHighToLow(int $limit = 50): array
    {
        return $this->repository->createQueryBuilder('m')
            ->where('m.price IS NOT NULL')
            ->orderBy('m.price', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function patch(Material $material, array $data): void
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = trim($value);
            }
        }

        if (isset($data['active'])) {
            if ($data['active']) {
                $this->tokenRepository->get($material->getToken());
                if (!$material->getTitle()) {
                    throw new \InvalidArgumentException('The title is required to activate the publication..');
                }
                if (!$material->getDescription()) {
                    throw new \InvalidArgumentException('The description is required to activate the publication.');
                }
            }
            $material->setActive((bool) $data['active']);
        }

        if (isset($data['title'])) {
            $material->setTitle($data['title']);
        }

        if (isset($data['logo'])) {
            $material->setLogo($data['logo'] ?? '');
        }

        if (isset($data['description'])) {
            $material->setDescription($data['description']);
        }

        if (isset($data['price'])) {
            $material->setPrice($data['price']);
        }

        if (!$material->getTitle() || !$material->getDescription()) {
            $material->setActive(false);
        }

        $this->save($material);
    }

    public function claim(UserInterface $user, array $tokens, WalletMessageSignature $walletSignature): void
    {
        $this->walletService->verifyWalletSignature($walletSignature);
        foreach ($tokens as $tokenPublicKey) {
            $tokenData = $this->tokenRepository->get($tokenPublicKey);
            if ($tokenData->getWalletPublicKey() === $walletSignature->getWalletPublicKey()) {
                if ($material = $this->findByTokenPublicKey($tokenPublicKey)) {
                    $material->setUser($user);
                    $this->em->persist($material);
                    $this->em->flush();
                }
            }
        }
    }

    public function delete(Material $material): void
    {
        try {
            $this->tokenRepository->get($material->getToken());
            throw new \InvalidArgumentException("Material can't be removed for active token in blockchain.");
        } catch (NotFoundException $e) {
            $this->materialCommentRepository->deleteByMaterialToken($material->getToken());
            $this->repository->deleteByToken($material->getToken());
        }
    }

    /**
     * Get main image file object by logo (thumbnail key).
     * Returns the full file object with all variants (key, keyPreview, keyThumbnail).
     *
     * @return array|null File object with key, keyPreview, keyThumbnail, etc.
     */
    public function getMainImageFile(Material $material): ?array
    {
        $logo = $material->getLogo();
        if (!$logo) {
            return null;
        }

        $files = $material->getFiles();
        if (!$files) {
            return null;
        }

        // Find file where keyThumbnail matches logo
        foreach ($files as $file) {
            if (($file['keyThumbnail'] ?? null) === $logo) {
                return $file;
            }
        }

        return null;
    }
}
