<?php

namespace App\Repository\Material;

use App\Entity\Material\MaterialVote;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MaterialVoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MaterialVote::class);
    }

    public function findExistingVote(string $materialToken, ?User $user = null, ?string $sessionId = null): ?MaterialVote
    {
        $qb = $this->createQueryBuilder('v')
            ->where('v.materialToken = :token')
            ->setParameter('token', $materialToken);

        if ($user) {
            $qb->andWhere('v.user = :user')
               ->setParameter('user', $user);
        } elseif ($sessionId) {
            $qb->andWhere('v.sessionId = :sessionId')
               ->setParameter('sessionId', $sessionId);
        } else {
            return null;
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

    public function countLikes(string $materialToken): int
    {
        return $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.materialToken = :token')
            ->andWhere('v.voteType = :type')
            ->setParameter('token', $materialToken)
            ->setParameter('type', 'like')
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countDislikes(string $materialToken): int
    {
        return $this->createQueryBuilder('v')
            ->select('COUNT(v.id)')
            ->where('v.materialToken = :token')
            ->andWhere('v.voteType = :type')
            ->setParameter('token', $materialToken)
            ->setParameter('type', 'dislike')
            ->getQuery()
            ->getSingleScalarResult();
    }
}