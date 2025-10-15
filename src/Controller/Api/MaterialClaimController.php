<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Entity\Wallet\WalletSignature;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
use App\Service\Material\MaterialService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material-claim', name: 'api_material_claim_')]
class MaterialClaimController extends BaseApiController
{
    public function __construct(
        private readonly MaterialService $materialService,
        private readonly MaterialRepository $materialRepository,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('', name: 'get', methods: ['GET'])]
    public function get(Request $request): JsonResponse
    {
        try {
            $this->checkAuthorization();
            $materialsToClaim = $this->materialRepository->getToClaim(
                $this->getUser(),
                $request->query->all('token'),
            );

            return $this->json($materialsToClaim, context: ['groups' => ['material:read']]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * @throws HttpException
     */
    #[Route('', name: 'claim', methods: ['POST'])]
    public function claim(Request $request): JsonResponse
    {
        try {
            $this->checkAuthorization();
            $payload = $request->getPayload();
            $this->materialService->claim(
                $this->getUser(),
                new WalletSignature($payload->all('walletSignature')),
                $payload->all('tokens'),
            );

            return $this->json(null);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
