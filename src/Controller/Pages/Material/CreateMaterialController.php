<?php

namespace App\Controller\Pages\Material;

use App\Entity\Category\CategoryConstants;
use App\Repository\Category\CategoryRepository;
use App\Repository\Material\MaterialRepository;
use App\Service\Category\CategoryService;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use App\Service\Template\TemplateService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CreateMaterialController extends AbstractController
{
    public function __construct(
        private PageService $pageService,
        private MaterialRepository $materialRepository,
        private MaterialService $materialService,
        private CategoryService $categoryService,
        private CategoryRepository $categoryRepository,
        private TemplateService $templateService,
    ) {}

    #[Route('/create-material', name: 'create_material', methods: ['GET'])]
    public function get(Request $request): Response
    {

        $this->pageService->init('/create-material');

        $category = $this->categoryRepository->get(CategoryConstants::MATERIALS_MAIN_ID);

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
            $request->attributes->get('_locale'),
        );

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/create.html.twig',
            'main_data' => [

            ],
            'categories' => $categories,
        ]);
    }
}
