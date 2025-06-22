<?php

namespace App\Controller;

use App\Entity\Category\CategoryConstants;
use App\Repository\Category\CategoryRepository;
use App\Service\Category\CategoryService;
use App\Service\Material\MaterialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

class MaterialController extends AbstractController
{
    public function __construct(
        private MaterialService $materialService,
        private CategoryService $categoryService,
        private CategoryRepository $categoryRepository,
    ) {}
    
    #[Route('/', name: 'main_page', methods: ['GET'])]
    public function index(): Response
    {   
        $category = $this->categoryRepository->get(CategoryConstants::MATERIALS_MAIN_ID);
        $categories = $this->categoryRepository->fetchCategories(CategoryConstants::MATERIALS_MAIN_ID);
                
        return $this->render('base.html.twig', [
            'main_template' => 'pages/gallery/index.twig',
            'main_data' => [
                'materials' => $this->materialService->fetch(),
            ],
            'categories' => $categories,
        ]);
    }
}
