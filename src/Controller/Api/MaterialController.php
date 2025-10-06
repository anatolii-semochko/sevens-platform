<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
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
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/{token}', name: 'get', methods: ['GET'])]
    public function get(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getAuthor()->getId());

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

            // If material already exists - we return the redirect to it's page
            if ($this->materialService->finByTokenPublicKey($tokenPublicKey)) {
                return new JsonResponse([
                    'message' => 'Material for this container already exists.',
                    'link' => $this->generateUrl('material_page', ['token' => $tokenPublicKey]),
                ]);
            }

            // Create inactive material
            $this->materialService->create(
                $this->getUser(),
                $tokenPublicKey,
                $payload->get('containerFileName'),
                $payload->get('containerHash'),
                $payload->all('walletSignature'),
            );

            // And return redirect to edit and activate material page
            return new JsonResponse([
                'message' => 'Material created successfully.',
                'redirect' => $this->generateUrl('material_manage_one', ['token' => $tokenPublicKey])
            ]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('/{token}', name: 'put', methods: ['PUT'])]
    public function put(string $token, Request $request): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getAuthor()->getId());
            $this->materialService->updateMaterial($material, $request->getPayload()->all());

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
