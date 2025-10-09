<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Service\Blockchain\TokenService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/token', name: 'api_token_')]
class TokenController extends BaseApiController
{
    public function __construct(
        private readonly TokenService $tokenService,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/{token}/sale-status', name: 'refresh_sale_status', methods: ['GET'])]
    public function refreshSaleStatus(string $token): JsonResponse
    {
        try {
            $tokenData = $this->tokenService->refreshSaleStatus($token);

            return $this->json($tokenData, context: ['groups' => ['material:read']]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
