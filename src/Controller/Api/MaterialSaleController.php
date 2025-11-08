<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialSaleHistoryRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material-sale', name: 'api_material_sale_')]
class MaterialSaleController extends BaseApiController
{
    public function __construct(
        private readonly MaterialRepository $materialRepository,
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
}
