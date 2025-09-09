<?php

namespace App\Controller\Pages\CreateTokenMaterial;

use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CreateTokenMaterialController extends AbstractController
{
    public function __construct(
        private readonly PageService $pageService,
    ) {}

    #[Route('/create-token-material', name: 'create_token_material', methods: ['GET'])]
    public function get(Request $request): Response
    {
        $this->pageService->init('/create-token-material');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/create-token-material/create-token-material.html.twig',
            'data' => [],
        ]);
    }
}
