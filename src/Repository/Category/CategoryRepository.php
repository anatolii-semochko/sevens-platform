<?php

namespace App\Repository\Category;

use App\Entity\Category\Category;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class CategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Category::class);
    }

    public function get(string $id): Object
    {
        $category = $this->find($id);
        if (!$category->getId()) {
            throw new NotFoundException('Category not found');
        }

        return $category;
    }

    public function fetchCategories(string $categoryId): array
    {        
        return $this->createQueryBuilder('c')
            ->leftJoin('c.childrenCategories', 'child')
            ->addSelect('child')
            ->leftJoin('c.translations', 'translation')
            ->addSelect('translation')
            ->leftJoin('child.translations', 'child_translation')
            ->addSelect('child_translation')
            ->where('c.parentCategory = :parentId')
            ->andWhere('c.active = 1')
            ->setParameter('parentId', $categoryId)
            ->orderBy('c.order', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
