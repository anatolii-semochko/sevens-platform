<?php

namespace App\Service\Category;

use App\Repository\Category\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;

class CategoryService
{
    public function __construct(
        private EntityManagerInterface $em,
        private CategoryRepository $repository,
    ) {}
}
