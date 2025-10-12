<?php

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Entity\Token\SevensTokenContainer;
use App\Repository\Material\MaterialRepository;
use App\Service\Blockchain\TokenService;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

readonly class MaterialService
{
    public function __construct(
        private EntityManagerInterface $em,
        private MaterialRepository $repository,
        private TokenService $tokenService,
    ) {}

    public function fetch(): array
    {
        return $this->repository->findBy([]);
    }

    public function finByTokenPublicKey(string $tokenPublicKey): ?Material
    {
        return $this->repository->findOneBy(['token' => $tokenPublicKey]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function create(
        UserInterface $user,
        SevensTokenContainer $sevensTokenContainer,
        string $tokenPublicKey,
        ?array $walletSignature,
    ): void {
        // Get token data from blockchain
        $token = $this->tokenService->getByPublicKey($tokenPublicKey);
        // Check if user owns the token
        $this->tokenService->checkUserPermissionToPublishMaterial($token, $walletSignature);

        // Create material
        $material = new Material();
        $material->setToken($tokenPublicKey);
        $material->setWallet($walletSignature['walletPublicKey']);
        $material->setTitle('');
        $material->setDescription('');
        $material->setLogo('');
        $material->setCreatedAt(new \DateTime());
        $material->setUpdatedAt(new \DateTime());
        $material->setAuthor($user);

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

    public function getByAuthor(Material $material, int $limit = 10): array
    {
        return $this->repository->createQueryBuilder('m')
            ->where('m.author = :author')
            ->andWhere('m.token != :currentToken')
            ->setParameter('author', $material->getAuthor())
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

    public function updateMaterial(Material $material, array $data): void
    {
        if (isset($data['active'])) {
            if ($data['active'] && !$material->getTitle()) {
                throw new \InvalidArgumentException('The title is required to activate the publication..');
            }
            if ($data['active'] && !$material->getDescription()) {
                throw new \InvalidArgumentException('The description is required to activate the publication.');
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

        $this->save($material);
    }
}
