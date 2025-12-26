<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialRepository;
use App\Service\Blockchain\TokenContainerService;
use App\Service\Blockchain\WalletService;
use App\Service\Material\MaterialService;
use Psr\Log\LoggerInterface;
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
        private readonly \App\Service\Material\MaterialFileService $materialFileService,
        private readonly \App\Repository\Token\TokenRepository $tokenRepository,
        private readonly \Doctrine\ORM\EntityManagerInterface $em,
        private readonly \App\Service\File\S3Service $s3Service,
        private readonly \App\Service\File\CdnService $cdnService,
        private readonly \App\Service\NodeServer\NodeServerApiClient $nodeServerApiClient,
        private readonly LoggerInterface $logger,
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

            // PHASE 1: BLOCKCHAIN VALIDATION
            // Validate token exists in blockchain (fail immediately if blockchain unavailable)
            $blockchainToken = $this->tokenRepository->get($tokenPublicKey);

            // Get blockchain-verified container hash (immutable, trusted source)
            $expectedHash = $blockchainToken->getHash();

            // Check if material already exists for this token
            if ($this->materialService->findByTokenPublicKey($tokenPublicKey)) {
                return $this->json([
                    'error' => 'Material already exists for this token'
                ], 400);
            }

            // PHASE 2: GENERATE PRESIGNED URL
            // Generate temporary S3 key (will be moved to permanent location after material creation)
            $uuid = \Symfony\Component\Uid\Uuid::v4()->toString();
            $sanitizedFileName = $this->materialFileService->sanitizeFilename($fileName);
            $tempS3Key = sprintf('materials/temp/%s/%s', $uuid, $sanitizedFileName);

            // Generate presigned upload URL (15 minutes expiration)
            // SHA-256 hash validation: AWS S3 will automatically reject files that don't match
            $expiresIn = 900; // 15 minutes
            $uploadUrl = $this->materialFileService->getPresignedUploadUrl(
                $tempS3Key,
                $expiresIn,
                $containerMd5, // MD5 (deprecated, optional)
                $expectedHash   // SHA-256 from blockchain (AWS will validate)
            );

            return $this->json([
                'uploadUrl' => $uploadUrl,
                'tempS3Key' => $tempS3Key,
                'bucket' => $this->materialFileService->getBucket(),
                'expectedHash' => $expectedHash, // From blockchain, not client
                'expiresAt' => time() + $expiresIn,
                'expiresIn' => $expiresIn,
            ]);
        } catch (\App\Exception\NotFoundException $e) {
            // Token not found in blockchain
            return $this->json([
                'error' => 'Token not found on blockchain'
            ], 404);
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
        $tempS3Key = null; // Track for cleanup

        try {
            $payload = $request->getPayload();
            $tokenPublicKey = $payload->get('tokenPublicKey');
            $walletSignature = $this->walletService->getSignatureFromArray($payload->all('walletSignature'));

            if (!$tokenPublicKey) {
                return $this->json(['error' => 'tokenPublicKey is required'], 400);
            }

            // ===== PHASE 1: BLOCKCHAIN VALIDATION =====
            // Fetch token from blockchain (fail immediately if unavailable)
            $blockchainToken = $this->tokenRepository->get($tokenPublicKey);

            // Check if material already exists
            if ($material = $this->materialService->findByTokenPublicKey($tokenPublicKey)) {
                return $this->json([
                    'created' => false,
                    'material' => $material,
                ], context: ['groups' => ['material:read', 'user:read']]);
            }

            // ===== PHASE 2: CONTAINER VALIDATION (Lambda with blockchain hash) =====
            if ($payload->has('s3Upload') && $s3Upload = $payload->all('s3Upload')) {
                $tempS3Key = $s3Upload['tempS3Key'] ?? null;
                $fileName = $s3Upload['fileName'] ?? 'archive.zip';

                if ($tempS3Key) {
                    // Get uploaded file metadata from S3
                    $fileMetadata = $this->s3Service->getFileMetadata($tempS3Key);
                    $uploadedSize = $fileMetadata['size'];

                    // Create expected container from uploaded file + blockchain hash
                    // Note: Size is NOT stored in blockchain, only hash is trusted from blockchain
                    $expectedContainer = new \App\Entity\Token\SevensTokenContainer(
                        $fileName,
                        $uploadedSize, // Size from uploaded file
                        $blockchainToken->getHash()  // Hash from blockchain (trusted)
                    );

                    // Lambda validates: uploaded file hash === blockchain hash
                    $validationResult = $this->materialFileService->validateUploadedContainer(
                        $tempS3Key,
                        $expectedContainer
                    );

                    if (!$validationResult['success']) {
                        // Validation failed - clean up and return error
                        $this->materialFileService->deleteTempFile($tempS3Key);
                        return $this->json([
                            'error' => 'Container verification failed: uploaded file does not match blockchain-validated hash',
                            'validationError' => $validationResult['error'] ?? 'Hash mismatch',
                        ], 400);
                    }
                }
            }

            // ===== PHASE 3: CREATE MATERIAL =====
            // Build container from blockchain data (NOT client data)
            $sevensTokenContainer = new \App\Entity\Token\SevensTokenContainer(
                $fileName ?? 'archive.zip', // File name from upload
                $uploadedSize ?? 0, // Actual size from S3
                $blockchainToken->getHash() // Hash from blockchain
            );

            // Create material (service validates ownership internally)
            $this->materialService->create(
                $this->getUser(),
                $tokenPublicKey,
                $sevensTokenContainer,
                $walletSignature,
            );

            $material = $this->materialService->findByTokenPublicKey($tokenPublicKey);

            // Store blockchain hash for audit trail
            $material->setArchiveHash($blockchainToken->getHash());
            $this->em->persist($material);
            $this->em->flush();

            // Emit WebSocket event for real-time notification
            $this->nodeServerApiClient->emitWebSocketEvent('material.created', [
                'token' => $tokenPublicKey,
                'title' => $material->getTitle(),
                'status' => 'created',
            ]);

            // ===== PHASE 4: FILE EXTRACTION =====
            if ($tempS3Key) {
                try {
                    // Move archive and extract files
                    $this->materialFileService->moveAndProcessTempArchive(
                        $material,
                        $tempS3Key,
                        $fileName ?? 'archive.zip'
                    );
                    $tempS3Key = null; // Success - no cleanup needed

                    // Emit WebSocket event when processing is complete
                    $this->nodeServerApiClient->emitWebSocketEvent('material.processing.complete', [
                        'token' => $tokenPublicKey,
                        'title' => $material->getTitle(),
                        'status' => 'validated',
                        'filesCount' => count($material->getFiles() ?? []),
                    ]);
                } catch (\Exception $e) {
                    // Material created but file processing failed
                    $this->logger->error("Failed to process archive for material {$tokenPublicKey}: " . $e->getMessage(), [
                        'exception' => $e,
                        'tokenPublicKey' => $tokenPublicKey,
                    ]);
                }
            }

            return $this->json([
                'created' => true,
                'material' => $material,
            ], context: ['groups' => ['material:read', 'user:read']]);

        } catch (\App\Exception\NotFoundException $e) {
            // Token not found in blockchain
            if ($tempS3Key) {
                $this->materialFileService->deleteTempFile($tempS3Key);
            }
            return $this->json(['error' => 'Token not found on blockchain'], 404);
        } catch (\Exception $e) {
            // Cleanup on any error
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
     * Upload material archive (ZIP file).
     *
     * @throws HttpException
     */
    #[Route('/{token}/upload-archive', name: 'upload_archive', methods: ['POST'])]
    public function uploadArchive(string $token, Request $request): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());

            // Get uploaded file
            $file = $request->files->get('archive');
            if (!$file) {
                return $this->json(['error' => 'No file uploaded'], 400);
            }

            // Upload and process
            $this->materialFileService->uploadArchive($material, $file);

            return $this->json([
                'success' => true,
                'status' => $material->getArchiveStatus(),
                'message' => 'Archive uploaded and processing started',
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
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
                $files = $this->materialFileService->getFilesWithUrls($material);
                $response['files'] = $files;
                // Backward compatibility - include old field names
                $response['availableImages'] = $files;
                $response['galleryImages'] = $files;
            }

            return $this->json($response);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * Select which images to display in the material gallery.
     *
     * @throws HttpException
     */
    #[Route('/{token}/select-images', name: 'select_images', methods: ['PUT'])]
    public function selectImages(string $token, Request $request): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());

            $payload = $request->getPayload();
            $selectedImageKeys = $payload->get('selectedImageKeys');

            if (!is_array($selectedImageKeys)) {
                return $this->json(['error' => 'selectedImageKeys must be an array'], 400);
            }

            $this->materialFileService->selectGalleryImages($material, $selectedImageKeys);

            $files = $this->materialFileService->getFilesWithUrls($material);
            return $this->json([
                'success' => true,
                'files' => $files,
                // Backward compatibility
                'galleryImages' => $files,
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * Get presigned download URL for material archive.
     *
     * @throws HttpException
     */
    #[Route('/{token}/archive-download-url', name: 'archive_download_url', methods: ['GET'])]
    public function getArchiveDownloadUrl(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());

            $url = $this->materialFileService->getArchiveDownloadUrl($material);

            return $this->json(['downloadUrl' => $url]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    /**
     * Delete material archive and all associated images.
     *
     * @throws HttpException
     */
    #[Route('/{token}/archive', name: 'delete_archive', methods: ['DELETE'])]
    public function deleteArchive(string $token): JsonResponse
    {
        try {
            $material = $this->materialRepository->get($token);
            $this->checkAuthorization($material->getUser()?->getId());

            $this->materialFileService->deleteArchive($material);

            return $this->json(['success' => true, 'message' => 'Archive deleted']);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
