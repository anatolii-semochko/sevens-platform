<?php

namespace App\Repository\Category;

use App\Entity\Category\Category;
use App\Exception\NotFoundException;
use App\Service\LocaleStorage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Category>
 */
class CategoryRepository extends ServiceEntityRepository
{
    public function __construct(
        private readonly ManagerRegistry $registry,
        private readonly LocaleStorage $localeStorage,
    ) {
        parent::__construct($registry, Category::class);
    }

    public function getByUrl(string $url): Category
    {
        $category = $this->findOneBy([
            'url' => $url,
            'active' => 1,
        ]);
        if (!$category->getId()) {
            throw new NotFoundException('Category not found');
        }

        return $category;
    }

    public function get(string $id): Category
    {
        $category = $this->find($id);
        if (!$category->getId()) {
            throw new NotFoundException('Category not found');
        }

        return $category;
    }

    public function fetchCategories(string $categoryId): array
    {
        $locale = $this->localeStorage->getLocale();

        $categories = $this->createQueryBuilder('c')
            ->leftJoin('c.childrenCategories', 'child')
            ->addSelect('child')
            ->leftJoin('c.translations', 'translation')
            ->addSelect('translation')
            ->leftJoin('translation.language', 'translation_language')
            ->addSelect('translation_language')
            ->leftJoin('child.translations', 'child_translation')
            ->addSelect('child_translation')
            ->leftJoin('child_translation.language', 'child_translation_language')
            ->addSelect('child_translation_language')
            ->where('c.parentCategory = :parentId')
            ->andWhere('c.active = 1')
            ->setParameter('parentId', $categoryId)
            ->orderBy('c.order', 'ASC')
            ->getQuery()
            ->getResult();

        foreach ($categories as $category) {
            $category->setCurrentLocale($locale);
            foreach ($category->getChildren() as $child) {
                $child->setCurrentLocale($locale);
            }
        }

        return $categories;
    }
}
