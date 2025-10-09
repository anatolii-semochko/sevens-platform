<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialSaleHistoryRepository;
use App\Service\Material\MaterialSaleService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material-sale', name: 'api_material_sale_')]
class MaterialSaleController extends BaseApiController
{
    public function __construct(
        private readonly MaterialRepository $materialRepository,
        private readonly MaterialSaleService $materialSaleService,
        private readonly MaterialSaleHistoryRepository $materialSaleHistoryRepository,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/{token}/history', name: 'get_history', methods: ['GET'])]
    public function getHistory(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $materialSaleHistory = $this->materialSaleHistoryRepository->getByToken($material->getToken());

            return $this->json($materialSaleHistory, context: ['groups' => ['material-sale-history:read']]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}/refresh', name: 'refresh', methods: ['POST'])]
    public function refresh(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->materialSaleService->refresh($material);

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
