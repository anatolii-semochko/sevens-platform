<?php

namespace App\Repository\Help;

use App\Entity\Help\Help;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HelpRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Help::class);
    }

    public function getByName(string $name): Help
    {
        return $this->createQueryBuilder('h')
            ->where('h.name = :name')
            ->setParameter('name', $name)
            ->getQuery()
            ->getOneOrNullResult() ?? throw new NotFoundException('Help not found');
    }

    public function getByUrl(string $url): ?Help
    {
        return $this->createQueryBuilder('h')
            ->where('h.url = :url')
            ->setParameter('url', $url)
            ->getQuery()
            ->getOneOrNullResult() ?? throw new NotFoundException('Help not found');
    }

    public function fetchByIds(array $ids): array
    {
        return $this->createQueryBuilder('h')
            ->where('h.id IN (:ids)')
            ->andWhere('h.url IS NOT NULL')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->getResult();
    }

    public function fetchAll(): array
    {
        return $this->createQueryBuilder('h')
            ->andWhere('h.url IS NOT NULL')
            ->getQuery()
            ->getResult();
    }
}
