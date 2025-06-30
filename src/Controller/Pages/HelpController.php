<?php

namespace App\Controller\Pages;

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

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        $this->pageService->init('/help');
        $tree = $this->helpService->getTree();

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
        );

        return $this->render('base.html.twig', [
            'main_template' => 'help/help-main.html.twig',
            'main_data' => [
                'tree' => $tree,
            ],
            'categories' => $categories,
        ]);
    }

    #[Route('/{slugPath}', name: 'page', requirements: ['slugPath' => '.+'], methods: ['GET'])]
    public function page(string $slugPath): Response
    {
        $this->pageService->init('/help');
        $help = $this->helpService->findHelpByUrlPath($slugPath);

        $categories = $this->categoryRepository->fetchCategories(
            CategoryConstants::MATERIALS_MAIN_ID,
        );

//        $this->helpService->generate();

        return $this->render('base.html.twig', [
            'main_template' => 'help/help-page.html.twig',
            'main_data' => [
                'help' => $help,
            ],
            'categories' => $categories,
        ]);
    }
}
