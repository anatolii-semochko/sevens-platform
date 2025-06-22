<?php

namespace App\Repository\PagesContent;

use App\Entity\PagesContent\Page;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\NonUniqueResultException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class PageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Page::class);
    }

    public function get(string $id): Object
    {
        $page = $this->find($id);
        if (!$page->getId()) {
            throw new NotFoundException('Page not found');
        }

        return $page;
    }
    
    public function findOneByTerm(string $term): ?Page
    {
        try {
            return $this->createQueryBuilder('p')
                ->where('p.term = :term')
                ->setParameter('term', $term)
                ->getQuery()
                ->getOneOrNullResult();   
        } catch (NonUniqueResultException $e) {
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }
}
