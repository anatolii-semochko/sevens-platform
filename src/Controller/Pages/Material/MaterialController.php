<?php

namespace App\Controller\Pages\Material;

use App\Controller\BaseController;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialVoteRepository;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Request;
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

    #[Route('/manage', name: 'manage', methods: ['GET'])]
    public function myMaterials(Request $request): Response
    {
        if ($response = $this->requireAuth($request)) {
            return $response;
        }

        $user = $this->getUser();
        $materials = $this->materialRepository->getMaterialsByUser($user->getId());

        $this->pageService->init('/material/manage-my-materials');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/materials-manage/list.html.twig',
            'data' => [
                'materials' => $materials
            ],
        ]);
    }

    #[Route('/claim', name: 'claim', methods: ['GET'])]
    public function claim(Request $request): Response
    {
        $this->pageService->init('/material/claim');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/materials-manage/claim.html.twig',
            'data' => [],
        ]);
    }

    #[Route('/manage/{token}', name: 'manage_one', methods: ['GET'])]
    public function manage(string $token, Request $request): Response
    {
        try {
            $material = $this->materialRepository->get($token);
            if ($response = $this->requireAuth($request, $material->getUser()?->getId())) {
                return $response;
            }

            $this->pageService->init('/material/edit', [
                'token' => $material->getToken(),
                'title' => $material->getTitle(),
                'description' => $material->getDescription(),
            ]);
        } catch (NotFoundException $e) {
            return $this->page404($this->pageService, $this->materialService);
        }

        return $this->render('base.html.twig', [
            'main_template' => 'pages/materials-manage/manage.html.twig',
            'data' => [
                'token' => $material->getToken(),
            ],
        ]);
    }

    #[Route('/{token}', name: 'page', methods: ['GET'])]
    public function get(string $token): Response
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->pageService->init('/material', [
                'token' => $material->getToken(),
                'title' => $material->getTitle(),
                'description' => $material->getDescription(),
            ]);
        } catch (NotFoundException $e) {
            return $this->page404($this->pageService, $this->materialService);
        }

        // If material is not active
        if (!$material->isActive()) {
            return $this->render('base.html.twig', [
                'main_template' => 'pages/material/main/material-inactive.html.twig',
                'data' => [
                    'material' => $material,
                ],
            ]);
        }

        $material->incrementViewCount();
        $this->materialService->save($material);

        return $this->render('base.html.twig', [
            'main_template' => 'pages/material/main/material.html.twig',
            'data' => [
                'material' => $material,
                'materialsHighestRated' => $this->materialService->getHighestRated(50, $material->getToken()),
                'materialsByPublisher' => $this->materialService->getByPublisher($material, 10),
                'likeCount' => $this->voteRepository->countLikes($material->getToken()),
                'dislikeCount' => $this->voteRepository->countDislikes($material->getToken()),
            ],
        ]);
    }
}
