<?php

namespace App\Repository\PageContent;

use App\Entity\PagesContent\Page;
use App\Entity\PagesContent\PageSeo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PageSeoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageSeo::class);
    }
    
    public function create(): PageSeo
    {
        return new PageSeo();
    }

    public function save(PageSeo $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByPageLocale(Page $page, string $locale): ?PageSeo
    {
        $qb = $this->createQueryBuilder('ps')
            ->join('ps.language', 'l')
            ->where('ps.page = :page')
            ->andWhere('l.code = :locale')
            ->setParameter('page', $page)
            ->setParameter('locale', $locale);

        return $qb->getQuery()->getOneOrNullResult();
    }
}
