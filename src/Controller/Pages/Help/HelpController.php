<?php

namespace App\Controller\Pages\Help;

use App\Controller\BaseController;
use App\Exception\NotFoundException;
use App\Service\Help\HelpService;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/help', name: 'help_')]
class HelpController extends BaseController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly HelpService $helpService,
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        try {
            $this->pageService->init('/help');
            $tree = $this->helpService->getTree();
        } catch (NotFoundException $e) {
            return $this->page404();
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
        $this->pageService->init('/help');
        try {
            $help = $this->helpService->findHelpByUrlPath($slugPath);
        } catch (NotFoundException $e) {
            return $this->page404();
        }

        return $this->render('base.html.twig', [
            'main_template' => 'help/help-page.html.twig',
            'data' => [
                'help' => $help,
            ],
        ]);
    }
}
