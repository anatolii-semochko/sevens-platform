<?php

namespace App\Controller\Pages\Help;

use App\Controller\BaseController;
use App\Exception\NotFoundException;
use App\Service\Help\HelpService;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/help', name: 'help_')]
class HelpController extends BaseController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly HelpService $helpService,
        private readonly MaterialService $materialService,
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        try {
            $tree = $this->helpService->getTree();
            $this->pageService->init('/help', seoLdParams: [$tree]);
        } catch (NotFoundException $e) {
            return $this->page404($this->pageService, $this->materialService);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'help/help-main.html.twig',
            'data' => [
                'tree' => $tree,
            ],
        ]);
    }

    #[Route('/{slugPath}', name: 'page', requirements: ['slugPath' => '.+'], methods: ['GET'])]
    public function page(string $slugPath): Response
    {
        try {
            $help = $this->helpService->findHelpByUrlPath($slugPath);
            $this->pageService->init('/help/page', [
                'title' => $help->seo->title,
                'keywords' => $help->seo->keywords,
                'description' => $help->seo->description,
            ], [$help]);
        } catch (NotFoundException $e) {
            return $this->page404($this->pageService, $this->materialService);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'help/help-page.html.twig',
            'data' => [
                'help' => $help,
            ],
        ]);
    }
}
