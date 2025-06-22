<?php

namespace App\Repository\PagesContent;

use App\Entity\PagesContent\PageContent;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\NonUniqueResultException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class PageContentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageContent::class);
    }

    public function get(string $id): Object
    {
        $term = $this->find($id);
        if (!$term->getId()) {
            throw new NotFoundException('Language not found');
        }

        return $term;
    }

    public function findByPage(int $pageId): ?PageContent
    {
        try {
            return $this->createQueryBuilder('pc')
                ->where('pc.page = :pageId')
                ->setParameter('pageId', $pageId)
                ->getQuery()
                ->getOneOrNullResult();
        } catch (NonUniqueResultException $e) {
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }
}
