<?php

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Entity\User;
use App\Repository\Material\MaterialRepository;
use App\Service\Blockchain\TokenService;
use App\Service\Blockchain\WalletService;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

readonly class MaterialService
{
    public function __construct(
        private EntityManagerInterface $em,
        private MaterialRepository $repository,
        private WalletService $walletService,
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

    public function create(
        User $user,
        string $title,
        string $shortDescription,
        string $description,
        string $containerFileName,
        string $containerHash,
        string $tokenPublicKey,
        array $walletSignature,
    ): void {
        // Get token data from blockchain
        $token = $this->tokenService->getByPublicKey($tokenPublicKey);

        // Check if wallet possess this token
        if ($token->getWalletPublicKey() !== $walletSignature['walletPublicKey']) {
            throw new InvalidArgumentException('Only the token owner can publish materials');
        }

        // Check wallet signature
        $this->walletService->verifyWalletSignature(
            $token->getWalletPublicKey(),
            $walletSignature['signature'],
            $walletSignature['nonce'],
        );


//        Token data directly from blockchain
//        dd([
//            'title' => $token->getName(),
//            'tokenName' => $token->getName(),
//            'author' => $token->getAuthor(),
//            'description' => $token->getDescription(),
//            'tokenPublicKey' => $token->getTokenPublicKey(),
//            'walletPublicKey' => $token->getWalletPublicKey(),
//            'hash' => $token->getHash(),
//            'isOnSale' => $token->isOnSale(),
//            'price' => $token->getPrice(),
//            'mintingTime' => $token->getMintingTime(),
//        ]);

//        Form data - will be removed and used on material edit page
//        dd([
//            'title' => $title,
//            'shortDescription' => $shortDescription,
//            'description' => $description,
//            '$containerFileName' => $containerFileName,
//            '$containerHash' => $containerHash,
//            'tokenPublicKey' => $tokenPublicKey,
//            'walletSignature' => $walletSignature,
//        ]);

        $material = new Material();
        $material->setToken($tokenPublicKey);
        $material->setTitle($title);
        $material->setDescription($description);
        $material->setLogo('logo');
        $material->setCreatedAt(new \DateTime());
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
}
