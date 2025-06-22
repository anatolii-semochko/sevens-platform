<?php

namespace App\Controller;

use App\Entity\Category\CategoryConstants;
use App\Exception\NotFoundException;
use App\Repository\Category\CategoryRepository;
use App\Repository\Material\MaterialRepository;
use App\Service\Category\CategoryService;
use App\Service\Material\MaterialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

class MaterialController extends AbstractController
{
    public function __construct(
        private MaterialRepository $materialRepository,
        private MaterialService $materialService,
        private CategoryService $categoryService,
        private CategoryRepository $categoryRepository,
    ) {}
    
    #[Route('/', name: 'main_page', methods: ['GET'])]
    public function index(Request $request): Response
    {   
        $category = $this->categoryRepository->get(CategoryConstants::MATERIALS_MAIN_ID);

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
            $request->attributes->get('_locale'),
        );
                
        return $this->render('base.html.twig', [
            'main_template' => 'pages/gallery/index.twig',
            'main_data' => [
                'materials' => $this->materialService->fetch(),
            ],
            'categories' => $categories,
        ]);
    }
    
    #[Route('/{token}', name: 'material_page', methods: ['GET'])]
    public function get(string $token, Request $request): Response
    {   
        $category = $this->categoryRepository->get(CategoryConstants::MATERIALS_MAIN_ID);

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
            $request->attributes->get('_locale'),
        );
                
        
        try {
            $material = $this->materialRepository->get($token);
        } catch (NotFoundException $e) {
            return new Response($this->renderView('pages/404.twig'), 404);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/material.twig',
            'main_data' => [
                'material' => $material,
            ],
            'categories' => $categories,
        ]);
    }
}
