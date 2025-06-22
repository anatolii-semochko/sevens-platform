<?php

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Repository\Material\MaterialRepository;
use Doctrine\ORM\EntityManagerInterface;

class MaterialService
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
        $material = new Material();
        $material->setToken(substr(md5(uniqid((string) microtime(), true)), 0, 44));
        $material->setTitle($data['title']);
        $material->setLogo($data['img']);
        $material->setDescription($data['description']);

        $this->em->persist($material);
        $this->em->flush();
    }

    
    
    
    
    public function import(): void
    {
        foreach ($this->data() as $data) {
            $this->create($data);
        }
    }
    private function data(): array
    {
        return json_decode(file_get_contents('/app/src/Service/Material/temp/media-data.json'), true);
    }
    
}