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

    public function get(string $id): Object
    {
        $help = $this->find($id);
        if (!$help->getId()) {
            throw new NotFoundException('Help not found');
        }

        return $help;
    }
}
