<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
use App\Service\Blockchain\TokenContainerService;
use App\Service\Blockchain\WalletService;
use App\Service\Material\MaterialService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material', name: 'api_material_')]
class MaterialController extends BaseApiController
{
    public function __construct(
        private readonly MaterialService $materialService,
        private readonly MaterialRepository $materialRepository,
        private readonly TokenContainerService $tokenContainerService,
        private readonly WalletService $walletService,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/{token}', name: 'get', methods: ['GET'])]
    public function get(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());

            return $this->json([
                'material' => $material,
            ], context: ['groups' => ['material:read']]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $payload = $request->getPayload();
            $tokenPublicKey = $payload->get('tokenPublicKey');

            // If material already exists
            if ($material = $this->materialService->finByTokenPublicKey($tokenPublicKey)) {
                return $this->json([
                    'created' => false,
                    'material' => $material,
                ], context: ['groups' => ['material:read', 'user:read']]);
            }

            // Create material
            $this->materialService->create(
                $this->getUser(),
                $tokenPublicKey,
                $this->tokenContainerService->getFromArray($payload->all('container')),
                $this->walletService->getSignatureFromArray($payload->all('walletSignature')),
            );

            return $this->json([
                'created' => true,
                'material' => $this->materialService->finByTokenPublicKey($tokenPublicKey),
            ], context: ['groups' => ['material:read', 'user:read']]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}', name: 'patch', methods: ['PATCH'])]
    public function patch(string $token, Request $request): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());
            $this->materialService->patch($material, $request->getPayload()->all());

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());
            $this->materialService->delete($material);

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
