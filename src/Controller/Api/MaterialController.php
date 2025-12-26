<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
use App\Service\Blockchain\TokenNotFoundException;
use App\Service\Blockchain\WalletService;
use App\Service\File\CdnService;
use App\Service\File\FileException;
use App\Service\Material\MaterialException;
use App\Service\Material\MaterialFileService;
use App\Service\Material\MaterialService;
use App\Service\NodeServer\NodeServerApiClient;
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
        private readonly WalletService $walletService,
        private readonly MaterialFileService $materialFileService,
        private readonly CdnService $cdnService,
        private readonly NodeServerApiClient $nodeServerApiClient,
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

            // Convert logo S3 key to CDN URL
            $logoUrl = $material->getLogo() ? $this->cdnService->getUrl($material->getLogo()) : null;

            $response = \App\Response\Api\Material\GetMaterialResponse::fromMaterial($material, $logoUrl);

            return $this->json(['material' => $response]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * Get presigned upload URL for material archive.
     *
     * SECURITY:
     * 1. Validates token ownership in blockchain before generating URL
     * 2. AWS S3 automatically validates SHA-256 checksum on upload
     * 3. Files that don't match blockchain hash are rejected by S3
     *
     * Client must include the checksum header when uploading:
     * - Header: x-amz-checksum-sha256
     * - Value: base64-encoded SHA-256 hash of the file
     *
     * @throws HttpException
     */
    #[Route('/presigned-upload-url', name: 'presigned_upload_url', methods: ['POST'])]
    public function getPresignedUploadUrl(Request $request): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('IS_AUTHENTICATED');

            $payload = $request->getPayload();
            $tokenPublicKey = $payload->get('tokenPublicKey');
            $fileName = $payload->get('fileName');
            $containerMd5 = $payload->get('containerMd5');

            if (!$tokenPublicKey) {
                return $this->json(['error' => 'tokenPublicKey is required'], 400);
            }

            if (!$fileName) {
                return $this->json(['error' => 'fileName is required'], 400);
            }

            // Prepare presigned URL (validates blockchain token and material non-existence)
            $uploadData = $this->materialFileService->preparePresignedUploadForToken(
                $tokenPublicKey,
                $fileName,
                $containerMd5
            );

            return $this->json($uploadData);
        } catch (TokenNotFoundException $e) {
            // Token not found in blockchain
            return $this->json(['error' => $e->getMessage()], 404);
        } catch (MaterialException | FileException $e) {
            // Material and file operation errors
            return $this->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * Create material with blockchain-validated container.
     *
     * SECURITY FLOW:
     * 1. Fetch token from blockchain (source of truth)
     * 2. Validate ownership (done by MaterialService)
     * 3. Lambda validates uploaded file hash matches blockchain hash
     * 4. Create material using blockchain data (not client data)
     *
     * @throws HttpException
     */
    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $tempS3Key = null;

        try {
            $payload = $request->getPayload();
            $tokenPublicKey = $payload->get('tokenPublicKey');
            $walletSignature = $this->walletService->getSignatureFromArray($payload->all('walletSignature'));

            if (!$tokenPublicKey) {
                return $this->json(['error' => 'tokenPublicKey is required'], 400);
            }

            // Extract S3 upload info
            $s3Upload = $payload->all('s3Upload');
            $tempS3Key = $s3Upload['tempS3Key'] ?? null;
            $fileName = $s3Upload['fileName'] ?? null;

            // Create material with archive validation workflow (service handles all business logic)
            $material = $this->materialService->createWithArchive(
                $this->getUser(),
                $tokenPublicKey,
                $walletSignature,
                $tempS3Key,
                $fileName
            );

            // Clear tempS3Key - service handles cleanup
            $tempS3Key = null;

            // Emit WebSocket event for real-time notification
            $this->nodeServerApiClient->emitWebSocketEvent('material.created', [
                'token' => $tokenPublicKey,
                'title' => $material->getTitle(),
                'status' => 'created',
            ]);

            // Emit processing complete event if files were extracted
            if ($material->getFiles()) {
                $this->nodeServerApiClient->emitWebSocketEvent('material.processing.complete', [
                    'token' => $tokenPublicKey,
                    'title' => $material->getTitle(),
                    'status' => 'validated',
                    'filesCount' => count($material->getFiles()),
                ]);
            }

            return $this->json([
                'created' => true,
                'material' => $material,
            ], context: ['groups' => ['material:read', 'user:read']]);

        } catch (TokenNotFoundException $e) {
            // Token not found in blockchain
            if ($tempS3Key) {
                $this->materialFileService->deleteTempFile($tempS3Key);
            }
            return $this->json(['error' => $e->getMessage()], 404);
        } catch (MaterialException | FileException $e) {
            // Business logic or file operation errors
            if ($tempS3Key) {
                $this->materialFileService->deleteTempFile($tempS3Key);
            }
            return $this->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            // Cleanup on any unexpected error
            if ($tempS3Key) {
                $this->materialFileService->deleteTempFile($tempS3Key);
            }
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

    /**
     * Get archive processing status and available images.
     *
     * @throws HttpException
     */
    #[Route('/{token}/archive-status', name: 'archive_status', methods: ['GET'])]
    public function getArchiveStatus(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());

            $response = [
                'status' => $material->getArchiveStatus(),
                'error' => $material->getArchiveValidationError(),
            ];

            // Include files with CDN URLs if validated
            if ($material->getArchiveStatus() === \App\Service\Material\MaterialFileService::STATUS_VALIDATED) {
                $response['files'] = $this->materialFileService->getFilesWithUrls($material);
            }

            return $this->json($response);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
