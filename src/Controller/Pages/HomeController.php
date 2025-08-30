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

        $sort = $request->query->get('sort', 'default');
        $materials = match($sort) {
            'new' => $this->materialService->getNewest(50),
            'popular' => $this->materialService->getHighestRated(50),
            'price-low' => $this->materialService->getByPriceLowToHigh(50),
            'price-high' => $this->materialService->getByPriceHighToLow(50),
            default => $this->materialService->fetch(),
        };

        return $this->render('base.html.twig', [
            'main_template' => 'pages/main/index.html.twig',
            'data' => [
                'materials' => $materials,
            ],
        ]);
    }
}
