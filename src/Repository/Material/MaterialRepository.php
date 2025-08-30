<?php

namespace App\Repository\Material;

use App\Entity\Material\Material;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

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
}
