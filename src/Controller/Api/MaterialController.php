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
        private readonly \App\Service\Material\MaterialFileService $materialFileService,
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
     * Get presigned upload URL for material archive.
     * Client will upload directly to S3 using this URL.
     *
     * @throws HttpException
     */
    #[Route('/presigned-upload-url', name: 'presigned_upload_url', methods: ['POST'])]
    public function getPresignedUploadUrl(Request $request): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('IS_AUTHENTICATED');

            $payload = $request->getPayload();
            $fileName = $payload->get('fileName');
            $containerHash = $payload->get('containerHash');
            $containerMd5 = $payload->get('containerMd5');
            $containerSize = $payload->get('containerSize');

            if (!$fileName) {
                return $this->json(['error' => 'fileName is required'], 400);
            }

            // Generate temporary S3 key (will be moved to permanent location after material creation)
            $uuid = \Symfony\Component\Uid\Uuid::v4()->toString();
            $sanitizedFileName = $this->materialFileService->sanitizeFilename($fileName);
            $tempS3Key = sprintf('materials/temp/%s/%s', $uuid, $sanitizedFileName);

            // Generate presigned upload URL (15 minutes expiration) with optional MD5 validation
            $uploadUrl = $this->materialFileService->getPresignedUploadUrl(
                $tempS3Key,
                900,
                $containerMd5
            );

            return $this->json([
                'uploadUrl' => $uploadUrl,
                'tempS3Key' => $tempS3Key,
                'bucket' => $this->materialFileService->getBucket(),
                'expectedHash' => $containerHash,
                'expectedSize' => $containerSize,
            ]);
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

            // VALIDATE BEFORE CREATING MATERIAL: If S3 upload provided, validate container first
            $validatedFiles = null;
            if ($payload->has('s3Upload') && $s3Upload = $payload->all('s3Upload')) {
                $tempS3Key = $s3Upload['tempS3Key'] ?? null;

                if ($tempS3Key) {
                    try {
                        // Validate uploaded container against expected metadata
                        $container = $this->tokenContainerService->getFromArray($payload->all('container'));
                        $validationResult = $this->materialFileService->validateUploadedContainer(
                            $tempS3Key,
                            $container
                        );

                        if (!$validationResult['success']) {
                            // Delete temp file on validation failure
                            $this->materialFileService->deleteTempFile($tempS3Key);

                            // Return error - DO NOT create material
                            return $this->json([
                                'error' => 'Container verification failed: ' . ($validationResult['error'] ?? 'Unknown error'),
                                'validationError' => $validationResult['error'] ?? 'Unknown error',
                            ], 400);
                        }

                        // Store extracted files for later use
                        $validatedFiles = $validationResult['files'] ?? [];
                    } catch (\Exception $e) {
                        // Clean up temp file on error
                        $this->materialFileService->deleteTempFile($tempS3Key);

                        return $this->json([
                            'error' => 'Failed to validate uploaded container: ' . $e->getMessage(),
                        ], 400);
                    }
                }
            }

            // ONLY CREATE MATERIAL IF VALIDATION PASSED (or no upload)
            $this->materialService->create(
                $this->getUser(),
                $tokenPublicKey,
                $this->tokenContainerService->getFromArray($payload->all('container')),
                $this->walletService->getSignatureFromArray($payload->all('walletSignature')),
            );

            $material = $this->materialService->finByTokenPublicKey($tokenPublicKey);

            // Move validated file to permanent location
            if ($payload->has('s3Upload') && $s3Upload = $payload->all('s3Upload')) {
                $tempS3Key = $s3Upload['tempS3Key'] ?? null;
                $originalFileName = $s3Upload['fileName'] ?? $payload->get('container')['name'] ?? 'archive.zip';

                if ($tempS3Key) {
                    try {
                        // File already validated, just move it
                        $this->materialFileService->moveTempArchive(
                            $material,
                            $tempS3Key,
                            $originalFileName,
                            $validatedFiles
                        );
                    } catch (\Exception $e) {
                        // Material created but file move failed - log error
                        error_log("Failed to move validated archive for material {$tokenPublicKey}: " . $e->getMessage());
                    }
                }
            }

            return $this->json([
                'created' => true,
                'material' => $material,
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
