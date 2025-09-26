<?php

namespace App\Controller\Pages\CreateTokenMaterial;

use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CreatePrivateTokenController extends AbstractController
{
    public function __construct(
        private readonly PageService $pageService,
    ) {}

    #[Route('/create-private-token', name: 'create_private_token', methods: ['GET'])]
    public function get(Request $request): Response
    {
        $this->pageService->init('/create-private-token');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/create-token-material/create-private-token.html.twig',
            'data' => [],
        ]);
    }
}
