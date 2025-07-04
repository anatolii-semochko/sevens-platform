<?php

namespace App\Controller\Pages\Token;

use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CheckTokenController extends AbstractController
{
    public function __construct(
        private readonly PageService $pageService,
    ) {}

    #[Route('/check-token', name: 'check_token', methods: ['GET'])]
    public function get(Request $request): Response
    {
        $this->pageService->init('/check-token');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/token/check.html.twig',
            'data' => [],
        ]);
    }
}
