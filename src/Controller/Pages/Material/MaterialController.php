<?php

namespace App\Controller\Pages\Material;

use App\Entity\Category\CategoryConstants;
use App\Exception\NotFoundException;
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

#[Route('/material', name: 'material_')]
class MaterialController extends AbstractController
{
    public function __construct(
        private PageService $pageService,
        private MaterialRepository $materialRepository,
        private MaterialService $materialService,
        private CategoryService $categoryService,
        private CategoryRepository $categoryRepository,
        private TemplateService $templateService,
    ) {}

    #[Route('/{token}', name: 'page', methods: ['GET'])]
    public function get(string $token, Request $request): Response
    {

        $this->pageService->init('/material');

        $category = $this->categoryRepository->get(CategoryConstants::MATERIALS_MAIN_ID);

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
            $request->attributes->get('_locale'),
        );

        try {
            $material = $this->materialRepository->get($token);
        } catch (NotFoundException $e) {
            return new Response($this->renderView('pages/404.html.twig'), 404);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/material.html.twig',
            'main_data' => [
                'material' => $material,
            ],
            'categories' => $categories,
        ]);
    }
}
