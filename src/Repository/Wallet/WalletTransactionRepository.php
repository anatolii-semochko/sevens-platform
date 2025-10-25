<?php

namespace App\Repository\Wallet;

use App\Entity\Wallet\WalletTransaction;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<WalletTransaction>
 */
class WalletTransactionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WalletTransaction::class);
    }

    public function get(string $id): WalletTransaction
    {
        $walletTransaction = $this->find($id);
        if (!$walletTransaction) {
            throw new NotFoundException('Wallet transaction not found.');
        }
        return $walletTransaction;
    }

    public function save(WalletTransaction $walletTransaction): void
    {
        $this->getEntityManager()->persist($walletTransaction);
        $this->getEntityManager()->flush();
    }

    public function findByTransaction(string $transaction): ?WalletTransaction
    {
        return $this->findOneBy(['transaction' => $transaction]);
    }

    public function getRecent(int $limit = 50): array
    {
        return $this->createQueryBuilder('wt')
            ->orderBy('wt.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findByDateRange(\DateTimeInterface $from, \DateTimeInterface $to): array
    {
        return $this->createQueryBuilder('wt')
            ->where('wt.createdAt >= :from')
            ->andWhere('wt.createdAt <= :to')
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('wt.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function countTotal(): int
    {
        return $this->createQueryBuilder('wt')
            ->select('COUNT(wt.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countByDateRange(\DateTimeInterface $from, \DateTimeInterface $to): int
    {
        return $this->createQueryBuilder('wt')
            ->select('COUNT(wt.id)')
            ->where('wt.createdAt >= :from')
            ->andWhere('wt.createdAt <= :to')
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
