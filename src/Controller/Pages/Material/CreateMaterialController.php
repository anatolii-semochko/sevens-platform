<?php

namespace App\Controller\Pages\Material;

use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CreateMaterialController extends AbstractController
{
    public function __construct(
        private readonly PageService $pageService,
    ) {}

    #[Route('/create-material', name: 'create_material', methods: ['GET'])]
    public function get(Request $request): Response
    {
        $this->pageService->init('/create-material');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/create/create.html.twig',
            'data' => [],
        ]);
    }
}
