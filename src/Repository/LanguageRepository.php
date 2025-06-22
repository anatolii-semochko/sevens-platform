<?php

namespace App\Repository;

use App\Entity\Language;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\NonUniqueResultException;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class LanguageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Language::class);
    }
    
    public function get(string $id): Object 
    {
        $language = $this->find($id);
        if (!$language->getId()) {
            throw new NotFoundException('Language not found');
        }
        
        return $language;
    }

    public function findActiveLanguages(): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('l.isMain', 'DESC')
            ->addOrderBy('l.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findMainLanguage(): ?Language
    {        
        try {
            return $this->createQueryBuilder('l')
                ->where('l.isMain = true')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult();
        } catch (NonUniqueResultException $e) {
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }
}
