<?php

namespace App\Repository\PageContent;

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

    public function create(): Page
    {
        return new Page();
    }

    public function save(Page $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByUrl(string $url): ?Page
    {
        try {
            return $this->createQueryBuilder('p')
                ->where('p.url = :url')
                ->setParameter('url', $url)
                ->getQuery()
                ->getOneOrNullResult();   
        } catch (NonUniqueResultException $e) {
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }
}
