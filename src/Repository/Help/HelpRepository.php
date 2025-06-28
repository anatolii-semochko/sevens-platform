<?php

namespace App\Repository\Help;

use App\Entity\Help\Help;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HelpRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Help::class);
    }

    public function findByUrl(string $url, string $locale): ?Help
    {
        $qb = $this->createQueryBuilder('h')
            ->addSelect('hc')  // основний контент
            ->addSelect('c')   // прямі діти
            ->addSelect('cc')  // контент дітей
            ->addSelect('cl')  // мова для контенту дітей
            ->join('h.contents', 'hc')
            ->join('hc.language', 'l', 'WITH', 'l.code = :locale')
            ->leftJoin('h.children', 'c')
            ->leftJoin('c.contents', 'cc')
            ->leftJoin('cc.language', 'cl', 'WITH', 'cl.code = :locale')
            ->where('h.url = :url')
            ->setParameter('url', $url)
            ->setParameter('locale', $locale);

//        $qb = $this->createQueryBuilder('h')
//            ->addSelect('hc') // основний контент
//            ->addSelect('c')  // прямі діти
//            ->addSelect('cc') // контент для дітей
//            ->join('h.contents', 'hc')
//            ->join('hc.language', 'l')
//            ->leftJoin('h.children', 'c')
//            ->leftJoin('c.contents', 'cc')
//            ->leftJoin('cc.language', 'cl')
//            ->where('h.url = :url')
//            ->andWhere('l.code = :locale')
//            ->andWhere('cl.code = :locale')
//            ->setParameter('url', $url)
//            ->setParameter('locale', $locale);

        return $qb->getQuery()->getOneOrNullResult();
    }

    public function findChildren(string $parentId): array
    {
        return $this->createQueryBuilder('h')
            ->andWhere('h.parentId = :parentId')
            ->setParameter('parentId', $parentId)
            ->orderBy('h.order', 'ASC')
            ->getQuery()
            ->getResult();
    }





    // TODO TEMPORARY _ TO REMOVE
    public function fetchAll(): array
    {
        return $this->findAll();
    }

}
