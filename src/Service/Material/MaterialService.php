<?php

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Repository\Material\MaterialRepository;
use Doctrine\ORM\EntityManagerInterface;

readonly class MaterialService
{
    public function __construct(
        private EntityManagerInterface $em,
        private MaterialRepository $repository,
    ) {}

    public function fetch(): array
    {
        return $this->repository->findBy([]);
    }

    public function create(array $data): void
    {
        // TODO - IS TEMPORARY and NOT IN USE
        $material = new Material();
        $material->setToken(substr(md5(uniqid((string) microtime(), true)), 0, 44));
        $material->setTitle($data['title']);
        $material->setLogo($data['img']);
        $material->setDescription($data['description']);

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
}
