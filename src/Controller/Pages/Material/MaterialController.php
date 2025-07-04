<?php

namespace App\Controller\Pages\Material;

use App\Controller\BaseController;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialRepository;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/material', name: 'material_')]
class MaterialController extends BaseController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly MaterialRepository $materialRepository,
    ) {}

    #[Route('/{token}', name: 'page', methods: ['GET'])]
    public function get(string $token, Request $request): Response
    {
        $this->pageService->init('/material');
        try {
            $material = $this->materialRepository->get($token);
        } catch (NotFoundException $e) {
            return $this->redirectPage404();
        }

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/material.html.twig',
            'data' => [
                'material' => $material,
            ],
        ]);
    }
}
