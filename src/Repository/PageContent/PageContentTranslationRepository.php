<?php

namespace App\Repository\PageContent;

use App\Entity\PagesContent\PageContentTranslation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PageContentTranslationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageContentTranslation::class);
    }
    
    public function create(): PageContentTranslation
    {
        return new PageContentTranslation();
    }

    public function save(PageContentTranslation $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByTermUrlLocale(string $term, ?string $pageUrl, string $locale): ?PageContentTranslation
    {
        $qb = $this->createQueryBuilder('pct')
            ->join('pct.pageContent', 'pc')
            ->join('pct.language', 'l')
            ->andWhere('pc.term = :term')
            ->andWhere('l.code = :locale')
            ->setParameter('term', $term)
            ->setParameter('locale', $locale);

        if ($pageUrl !== null) {
            // Приєднуємо сторінку і фільтруємо по URL
            $qb->join('pc.page', 'p')
                ->andWhere('p.url = :pageUrl')
                ->setParameter('pageUrl', $pageUrl);
        } else {
            // Фільтруємо PageContent без сторінки (page IS NULL)
            $qb->andWhere('pc.page IS NULL');
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

//    public function findOneByPageContentAndLocale($pageContent, string $locale): ?PageContentTranslation
//    {
//        return $this->createQueryBuilder('pct')
//            ->join('pct.language', 'l')
//            ->andWhere('pct.pageContent = :pageContent')
//            ->andWhere('l.locale = :locale')
//            ->setParameter('pageContent', $pageContent)
//            ->setParameter('locale', $locale)
//            ->getQuery()
//            ->getOneOrNullResult();
//    }
}
