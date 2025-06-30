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
}
