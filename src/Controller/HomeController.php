<?php

namespace App\Controller;

use App\Entity\Category\CategoryConstants;
use App\Repository\Category\CategoryRepository;
use App\Service\Category\CategoryService;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

#[Route('/', name: 'home_')]
class HomeController extends AbstractController
{
    public function __construct(
        private PageService $pageService,
        private MaterialService $materialService,
        private CategoryService $categoryService,
        private CategoryRepository $categoryRepository,
    ) {}

    #[Route('/', name: 'page', methods: ['GET'])]
    public function index(Request $request): Response
    {
        $this->pageService->init('/');

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
}
