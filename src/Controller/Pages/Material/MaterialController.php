<?php

namespace App\Controller\Pages\Material;

use App\Controller\BaseController;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialVoteRepository;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/material', name: 'material_')]
class MaterialController extends BaseController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly MaterialService $materialService,
        private readonly MaterialRepository $materialRepository,
        private readonly MaterialVoteRepository $voteRepository,
    ) {}

    #[Route('/{token}', name: 'page', methods: ['GET'])]
    public function get(string $token): Response
    {
        try {
            $material = $this->materialRepository->get($token);

            // Increment view count
            $material->incrementViewCount();
            $this->materialService->save($material);

            $this->pageService->init('/material', [
                'token' => $material->getToken(),
                'title' => $material->getTitle(),
                'description' => $material->getDescription(),
            ]);
        } catch (NotFoundException $e) {
            return $this->page404($this->pageService, $this->materialService);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/main/material.html.twig',
            'data' => [
                'material' => $material,
                'materialsHighestRated' => $this->materialService->getHighestRated(50, $material->getToken()),
                'materialsByAuthor' => $this->materialService->getByAuthor($material, 10),
                'likeCount' => $this->voteRepository->countLikes($material->getToken()),
                'dislikeCount' => $this->voteRepository->countDislikes($material->getToken()),
                'isLoggedIn' => $this->getUser() !== null,
            ],
        ]);
    }

    #[Route('/{token}/edit', name: 'material-edit', methods: ['GET'])]
    public function edit(string $token): Response
    {
        try {
            $this->checkAuthorization($this->getUser());
            $material = $this->materialRepository->get($token);

            $this->pageService->init('/material/edit', [
                'token' => $material->getToken(),
                'title' => $material->getTitle(),
                'description' => $material->getDescription(),
            ]);
        } catch (NotFoundException $e) {
            return $this->page404($this->pageService, $this->materialService);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/edit/material-edit.html.twig',
            'data' => [
                'material' => [
                    'token' => $material->getToken(),
                    'title' => $material->getTitle(),
                    'logo' => $material->getLogo(),
                    'description' => $material->getDescription(),
                    'createdAt' => $material->getCreatedAt()?->format('c'),
                ]
            ],
        ]);
    }
}
