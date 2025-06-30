<?php

namespace App\Controller\Pages;

use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/', name: 'home_')]
class HomeController extends AbstractController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly MaterialService $materialService,
    ) {}

    #[Route('/', name: 'page', methods: ['GET'])]
    public function index(Request $request): Response
    {
        $this->pageService->init('/');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/gallery/index.html.twig',
            'data' => [
                'materials' => $this->materialService->fetch(),
            ],
        ]);
    }
}
