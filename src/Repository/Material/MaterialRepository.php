<?php

namespace App\Repository\Material;

use App\Entity\Material\Material;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @extends ServiceEntityRepository<Material>
 */
class MaterialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Material::class);
    }

    public function get(string $token): Material
    {
        $material = $this->find($token);
        if (!$material instanceof Material) {
            throw new NotFoundException('Material not found');
        }

        return $material;
    }


    public function create(): Material
    {
        return new Material();
    }

    public function getMaterialsByUser(string $userId): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.user = :userId')
            ->setParameter('userId', $userId)
            ->orderBy('m.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getToClaim(UserInterface $user, array $tokens): array
    {
        if (empty($tokens)) {
            return [];
        }

        return $this->createQueryBuilder('m')
            ->where('m.token IN (:tokens)')
            ->andWhere('(m.user != :userId OR m.user IS NULL)')
            ->setParameter('tokens', $tokens)
            ->setParameter('userId', $user->getId())
            ->getQuery()
            ->getResult();
    }
}
