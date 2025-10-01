<?php

namespace App\Controller\Api;

use App\Exception\WrappedHttpException;
use App\Service\Material\MaterialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material', name: 'api_material_')]
class MaterialController extends AbstractController
{
    public function __construct(
        private readonly MaterialService $materialService,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/create', name: 'material_create', methods: ['POST'])]
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
                $payload->get('title'),
                $payload->get('shortDescription'),
                $payload->get('description'),
                $payload->get('containerFileName'),
                $payload->get('containerHash'),
                $tokenPublicKey,
                $payload->all('walletSignature'),
            );

            // And return redirect to edit and activate material page
            return new JsonResponse([
                'message' => 'Material created successfully.',
                'redirect' => $this->generateUrl('material_page', ['token' => $tokenPublicKey])
            ]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
