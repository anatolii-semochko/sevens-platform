<?php

namespace App\Repository\PageContent;

use App\Entity\PagesContent\PageContent;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PageContentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageContent::class);
    }

    public function create(): PageContent
    {
        return new PageContent();
    }

    public function get(string $id): Object
    {
        $term = $this->find($id);
        if (!$term->getId()) {
            throw new NotFoundException('Language not found');
        }

        return $term;
    }

    public function findOneByTermUrlLocale(string $term, ?string $pageUrl, string $locale): ?PageContent
    {
        $qb = $this->createQueryBuilder('pc')
            ->leftJoin('pc.translations', 't', 'WITH', 't.language IN (
                SELECT l_sub FROM App\Entity\Language\Language l_sub WHERE l_sub.code = :locale
            )')
            ->leftJoin('t.language', 'l')
            ->addSelect('t', 'l')
            ->where('pc.term = :term')
            ->setParameter('term', $term)
            ->setParameter('locale', $locale);

        if ($pageUrl !== null) {
            $qb->join('pc.page', 'p')
                ->andWhere('p.url = :url')
                ->setParameter('url', $pageUrl);
        } else {
            $qb->andWhere('pc.page IS NULL');
        }

        return $qb->getQuery()->getOneOrNullResult();
    }
}
