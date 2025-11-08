<?php

declare(strict_types=1);

namespace App\Repository\TokenManage;

use App\Entity\TokenManage\ManageTariffHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ManageTariffHistory>
 */
class ManageTariffHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ManageTariffHistory::class);
    }

    /**
     * Get all tariff history ordered by date
     */
    public function getAll(): array
    {
        return $this->createQueryBuilder('th')
            ->orderBy('th.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Get latest tariff entry
     */
    public function getLatest(): ?ManageTariffHistory
    {
        return $this->createQueryBuilder('th')
            ->orderBy('th.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
