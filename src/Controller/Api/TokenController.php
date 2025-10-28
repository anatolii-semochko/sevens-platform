<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Service\Blockchain\TokenService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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

    /**
     * @throws HttpException
     */
    #[Route('/{token}/sale/{price}', name: 'get_sale_transaction', methods: ['GET'])]
    public function getSaleTransaction(string $token, int $price): JsonResponse
    {
        try {
            return $this->json($this->tokenService->getSaleTransaction($token, $price));
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}/sale', name: 'sale', methods: ['POST'])]
    public function sale(string $token, Request $request): JsonResponse
    {
        try {
            $payload = $request->getPayload();
            $this->tokenService->sale(
                $this->getUser(),
                $token,
                $payload->get('transactionId'),
                $payload->get('txSignature'),
            );

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}/buy/{buyerPublicKey}', name: 'get_buy_transaction', methods: ['GET'])]
    public function getBuyTransaction(string $token, string $buyerPublicKey): JsonResponse
    {
        try {
            return $this->json($this->tokenService->getBuyTransaction($token, $buyerPublicKey));
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}/buy', name: 'buy', methods: ['POST'])]
    public function buy(string $token, Request $request): JsonResponse
    {
        try {
            $payload = $request->getPayload();
            $this->tokenService->buy(
                $this->getUser(),
                $token,
                $payload->get('transactionId'),
                $payload->get('txSignature'),
                $payload->get('deactivate'),
            );

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}/burn', name: 'get_burn_transaction', methods: ['GET'])]
    public function getBurnTransaction(string $token): JsonResponse
    {
        try {
            return $this->json($this->tokenService->getBurnTransaction($token));
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}/burn', name: 'burn', methods: ['POST'])]
    public function burn(string $token, Request $request): JsonResponse
    {
        try {
            $payload = $request->getPayload();
            $this->tokenService->burn(
                $token,
                $payload->get('transactionId'),
                $payload->get('txSignature'),
            );

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
