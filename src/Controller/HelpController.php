<?php

namespace App\Controller;

use App\Entity\Category\CategoryConstants;
use App\Repository\Category\CategoryRepository;
use App\Service\Help\HelpService;
use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/help', name: 'help_')]
class HelpController extends AbstractController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly HelpService $helpService,
        private readonly CategoryRepository $categoryRepository,
    ) {}

//    #[Route('/api/help/tree', name: 'api_help_tree', methods: ['GET'])]
//    public function getHelpTree(): JsonResponse
//    {
//        $tree = $this->helpService->getHelpTree();
//        return $this->json($tree);
//    }

    #[Route('/{slugPath}', name: 'page', requirements: ['slugPath' => '.+'], methods: ['GET'])]
    public function index(string $slugPath): Response
    {
        $this->pageService->init('/help');

//        $this->helpService->generate();

        $help = $this->helpService->findHelpByUrlPath($slugPath);
//        dd($help->getBreadcrumbs());
//        dd($help);

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
        );

//        dd($this->helpService->getBreadcrumbs($help->getParentId()));

        return $this->render('base.html.twig', [
            'main_template' => 'help/main.twig',
            'main_data' => [
                'help' => $help,
                //'breadcrumbs' => $help->getBreadcrumbs(),
            ],
            'categories' => $categories,
        ]);
    }
}
