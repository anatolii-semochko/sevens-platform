<?php

namespace App\Repository\Material;

use App\Entity\Material\MaterialComment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MaterialCommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MaterialComment::class);
    }

    public function findByMaterialToken(string $materialToken): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.user', 'u')
            ->addSelect('u')
            ->where('c.materialToken = :token')
            ->setParameter('token', $materialToken)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findTopLevelCommentsByMaterialToken(string $materialToken): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.user', 'u')
            ->addSelect('u')
            ->where('c.materialToken = :token')
            ->andWhere('c.parent IS NULL')
            ->setParameter('token', $materialToken)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findRepliesByParentId(int $parentId): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.user', 'u')
            ->addSelect('u')
            ->where('c.parent = :parentId')
            ->setParameter('parentId', $parentId)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function save(MaterialComment $comment): void
    {
        $this->getEntityManager()->persist($comment);
        $this->getEntityManager()->flush();
    }

    public function delete(MaterialComment $comment): void
    {
        $this->getEntityManager()->remove($comment);
        $this->getEntityManager()->flush();
    }

    public function deleteByMaterialToken(string $materialToken): int
    {
        return $this->createQueryBuilder('c')
            ->delete()
            ->where('c.materialToken = :token')
            ->setParameter('token', $materialToken)
            ->getQuery()
            ->execute();
    }
}
