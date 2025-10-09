<?php

namespace App\Repository\Material;

use App\Entity\Material\MaterialSaleHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MaterialSaleHistory>
 */
class MaterialSaleHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MaterialSaleHistory::class);
    }

    public function create(): MaterialSaleHistory
    {
        return new MaterialSaleHistory();
    }

    public function save(MaterialSaleHistory $materialSaleHistory): void
    {
        $this->getEntityManager()->persist($materialSaleHistory);
        $this->getEntityManager()->flush();
    }

    /**
     * Get sale history for a specific token
     */
    public function getByToken(string $token): array
    {
        return $this->createQueryBuilder('msh')
            ->where('msh.token = :token')
            ->setParameter('token', $token)
            ->orderBy('msh.date', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Get sale history for a specific wallet
     */
    public function getByWallet(string $wallet): array
    {
        return $this->createQueryBuilder('msh')
            ->where('msh.wallet = :wallet')
            ->setParameter('wallet', $wallet)
            ->orderBy('msh.date', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Get latest sale entry for a token
     */
    public function getLatestByToken(string $token): ?MaterialSaleHistory
    {
        return $this->createQueryBuilder('msh')
            ->where('msh.token = :token')
            ->setParameter('token', $token)
            ->orderBy('msh.date', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Create a new sale history entry
     */
    public function createEntry(string $token, string $wallet, ?float $price = null): MaterialSaleHistory
    {
        $saleHistory = $this->create();
        $saleHistory->setToken($token);
        $saleHistory->setWallet($wallet);
        $saleHistory->setPrice($price);

        $this->save($saleHistory);

        return $saleHistory;
    }
}
