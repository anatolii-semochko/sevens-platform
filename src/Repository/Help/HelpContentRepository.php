<?php

namespace App\Repository\Help;

use App\Entity\Help\HelpContent;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HelpContentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HelpContent::class);
    }


    // TODO - TEMPORARY FOR TESTING - TO REMOVE
    public function getByHelpId(string $helpId, string $languageId): ?HelpContent
    {
        return $this->createQueryBuilder('hc')
            ->addSelect('hc')
            ->join('hc.help', 'h')
            ->join('hc.language', 'l')
            ->where('hc.help = :help')
            ->setParameter('help', $helpId)
            ->andWhere('l.code = :language')
            ->setParameter('language', $languageId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function save(HelpContent $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(HelpContent $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    // Додаткові методи запиту за потреби...
}
