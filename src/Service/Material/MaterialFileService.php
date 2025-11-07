<?php

declare(strict_types=1);

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Service\File\CdnService;
use App\Service\File\LambdaService;
use App\Service\File\S3Service;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

readonly class MaterialFileService
{
    // Archive status constants
    public const string STATUS_PENDING = 'pending';
    public const string STATUS_PROCESSING = 'processing';
    public const string STATUS_VALIDATED = 'validated';
    public const string STATUS_FAILED = 'failed';

    // File size limits
    private const int MAX_ARCHIVE_SIZE = 100 * 1024 * 1024; // 100 MB

    public function __construct(
        private EntityManagerInterface $em,
        private S3Service $s3Service,
        private LambdaService $lambdaService,
        private CdnService $cdnService,
    ) {}

    /**
     * Upload and process material archive.
     * This is the main entry point for archive upload workflow.
     *
     * @throws \InvalidArgumentException
     * @throws \RuntimeException
     */
    public function uploadArchive(Material $material, UploadedFile $file): void
    {
        // Validate file
        $this->validateArchiveFile($file);

        // Generate S3 key
        $s3Key = $this->generateArchiveKey($material->getToken(), $file->getClientOriginalName());

        try {
            // Upload to S3
            $this->s3Service->uploadFile($file, $s3Key);

            // Update material with archive info
            $material->setArchiveS3Key($s3Key);
            $material->setArchiveS3Bucket($this->s3Service->getBucket());
            $material->setArchiveStatus(self::STATUS_PROCESSING);
            $material->setArchiveValidationError(null);

            $this->em->persist($material);
            $this->em->flush();

            // Trigger Lambda validation (synchronous for now, could be async)
            $this->processArchive($material);

        } catch (\Exception $e) {
            // Clean up S3 on failure
            if (isset($s3Key) && $this->s3Service->fileExists($s3Key)) {
                $this->s3Service->deleteFile($s3Key);
            }

            // Update material status
            $material->setArchiveStatus(self::STATUS_FAILED);
            $material->setArchiveValidationError($e->getMessage());
            $this->em->persist($material);
            $this->em->flush();

            throw $e;
        }
    }

    /**
     * Process archive with Lambda function.
     *
     * @throws \RuntimeException
     */
    public function processArchive(Material $material): void
    {
        if (!$material->getArchiveS3Key() || !$material->getArchiveS3Bucket()) {
            throw new \InvalidArgumentException('Material does not have an archive uploaded');
        }

        try {
            // Invoke Lambda function
            $result = $this->lambdaService->validateMaterialArchive(
                $material->getArchiveS3Bucket(),
                $material->getArchiveS3Key(),
                $material->getToken()
            );

            // Process Lambda response
            if ($result['success'] ?? false) {
                $material->setArchiveStatus(self::STATUS_VALIDATED);
                $material->setArchiveValidationError(null);
                $material->setFiles($result['images'] ?? []);
            } else {
                $material->setArchiveStatus(self::STATUS_FAILED);
                $material->setArchiveValidationError($result['error'] ?? 'Unknown validation error');
                $material->setFiles(null);
            }

            $this->em->persist($material);
            $this->em->flush();

        } catch (\Exception $e) {
            $material->setArchiveStatus(self::STATUS_FAILED);
            $material->setArchiveValidationError('Lambda processing failed: ' . $e->getMessage());
            $this->em->persist($material);
            $this->em->flush();

            throw new \RuntimeException('Failed to process archive: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Select which images to display (updates the files list).
     *
     * @param array<string> $selectedImageKeys
     * @throws \InvalidArgumentException
     */
    public function selectGalleryImages(Material $material, array $selectedImageKeys): void
    {
        if ($material->getArchiveStatus() !== self::STATUS_VALIDATED) {
            throw new \InvalidArgumentException('Archive must be validated before selecting images');
        }

        $files = $material->getFiles();
        if (!$files) {
            throw new \InvalidArgumentException('No files available to select from');
        }

        // Extract available file keys
        $availableKeys = array_column($files, 'key');

        // Validate that all selected keys exist in available files
        $invalidKeys = array_diff($selectedImageKeys, $availableKeys);
        if (!empty($invalidKeys)) {
            throw new \InvalidArgumentException(
                'Invalid file keys selected: ' . implode(', ', $invalidKeys)
            );
        }

        // Filter files to get only selected ones
        $selectedFiles = array_filter(
            $files,
            fn(array $file) => in_array($file['key'], $selectedImageKeys, true)
        );

        // Reset array keys and save
        $material->setFiles(array_values($selectedFiles));
        $this->em->persist($material);
        $this->em->flush();
    }

    /**
     * Get files with CDN URLs.
     *
     * @return array<array{key: string, name: string, size: int, type: string, url: string}>
     */
    public function getFilesWithUrls(Material $material): array
    {
        $files = $material->getFiles();
        if (!$files) {
            return [];
        }

        return $this->cdnService->addUrlsToImages($files);
    }

    /**
     * Get available images with CDN URLs (alias for backward compatibility).
     *
     * @return array<array{key: string, name: string, size: int, type: string, url: string}>
     * @deprecated Use getFilesWithUrls() instead
     */
    public function getAvailableImagesWithUrls(Material $material): array
    {
        return $this->getFilesWithUrls($material);
    }

    /**
     * Get gallery images with CDN URLs (alias for backward compatibility).
     *
     * @return array<array{key: string, name: string, size: int, type: string, url: string}>
     * @deprecated Use getFilesWithUrls() instead
     */
    public function getGalleryImagesWithUrls(Material $material): array
    {
        return $this->getFilesWithUrls($material);
    }

    /**
     * Get presigned download URL for material archive.
     *
     * @throws \RuntimeException
     */
    public function getArchiveDownloadUrl(Material $material, ?int $expirationSeconds = null): string
    {
        if (!$material->getArchiveS3Key()) {
            throw new \InvalidArgumentException('Material does not have an archive');
        }

        return $this->s3Service->getPresignedDownloadUrl(
            $material->getArchiveS3Key(),
            $expirationSeconds
        );
    }

    /**
     * Delete material archive and all associated images.
     *
     * @throws \RuntimeException
     */
    public function deleteArchive(Material $material): void
    {
        // Delete archive file
        if ($material->getArchiveS3Key() && $this->s3Service->fileExists($material->getArchiveS3Key())) {
            $this->s3Service->deleteFile($material->getArchiveS3Key());
        }

        // Delete extracted images
        if ($files = $material->getFiles()) {
            foreach ($files as $file) {
                $fileKey = $file['key'];
                if ($this->s3Service->fileExists($fileKey)) {
                    $this->s3Service->deleteFile($fileKey);
                }
            }
        }

        // Clear material fields
        $material->setArchiveS3Key(null);
        $material->setArchiveS3Bucket(null);
        $material->setArchiveStatus(null);
        $material->setArchiveValidationError(null);
        $material->setFiles(null);

        $this->em->persist($material);
        $this->em->flush();
    }

    /**
     * Validate uploaded archive file.
     *
     * @throws \InvalidArgumentException
     */
    private function validateArchiveFile(UploadedFile $file): void
    {
        // Check if file was uploaded successfully
        if (!$file->isValid()) {
            throw new \InvalidArgumentException(
                'File upload failed: ' . $file->getErrorMessage()
            );
        }

        // Check MIME type
        $allowedMimeTypes = ['application/zip', 'application/x-zip-compressed'];
        if (!in_array($file->getMimeType(), $allowedMimeTypes, true)) {
            throw new \InvalidArgumentException(
                'Invalid file type. Only ZIP archives are allowed.'
            );
        }

        // Check file size
        if ($file->getSize() > self::MAX_ARCHIVE_SIZE) {
            throw new \InvalidArgumentException(
                sprintf(
                    'File too large. Maximum size is %d MB.',
                    self::MAX_ARCHIVE_SIZE / (1024 * 1024)
                )
            );
        }

        // Check file extension
        if (strtolower($file->getClientOriginalExtension()) !== 'zip') {
            throw new \InvalidArgumentException(
                'Invalid file extension. Only .zip files are allowed.'
            );
        }
    }

    /**
     * Generate S3 key for archive file.
     */
    private function generateArchiveKey(string $materialToken, string $originalFilename): string
    {
        $timestamp = time();
        $sanitizedFilename = $this->sanitizeFilename($originalFilename);

        return sprintf(
            'materials/%s/archive/%d_%s',
            $materialToken,
            $timestamp,
            $sanitizedFilename
        );
    }

    /**
     * Sanitize filename for S3.
     */
    public function sanitizeFilename(string $filename): string
    {
        // Remove path components
        $filename = basename($filename);

        // Replace spaces with underscores
        $filename = str_replace(' ', '_', $filename);

        // Remove special characters except dots, dashes, and underscores
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);

        return $filename;
    }

    /**
     * Validate uploaded container file against expected metadata.
     * Invokes Lambda to verify hash, size, and extract files.
     *
     * @param string $tempS3Key S3 key of uploaded temp file
     * @param \App\Entity\Token\SevensTokenContainer $expectedContainer Expected container metadata
     * @return array{success: bool, error?: string, files?: array}
     * @throws \RuntimeException
     */
    public function validateUploadedContainer(
        string $tempS3Key,
        \App\Entity\Token\SevensTokenContainer $expectedContainer
    ): array {
        try {
            // Check file exists
            if (!$this->s3Service->fileExists($tempS3Key)) {
                return [
                    'success' => false,
                    'error' => 'Uploaded file not found in temporary storage',
                ];
            }

            // Get file metadata from S3
            $fileMetadata = $this->s3Service->getFileMetadata($tempS3Key);

            // Quick size check before invoking Lambda
            if ($fileMetadata['size'] !== $expectedContainer->getSize()) {
                return [
                    'success' => false,
                    'error' => sprintf(
                        'File size mismatch: uploaded %d bytes, expected %d bytes',
                        $fileMetadata['size'],
                        $expectedContainer->getSize()
                    ),
                ];
            }

            // Invoke Lambda for full validation (hash + ZIP structure)
            $result = $this->lambdaService->validateMaterialArchive(
                $this->s3Service->getBucket(),
                $tempS3Key,
                'temp-validation', // Temporary token for validation
                [
                    'hash' => $expectedContainer->getHash(),
                    'size' => $expectedContainer->getSize(),
                    'name' => $expectedContainer->getName(),
                ]
            );

            return $result;

        } catch (\Exception $e) {
            throw new \RuntimeException(
                'Container validation failed: ' . $e->getMessage(),
                0,
                $e
            );
        }
    }

    /**
     * Delete temporary file from S3.
     *
     * @param string $tempS3Key S3 key of temp file to delete
     */
    public function deleteTempFile(string $tempS3Key): void
    {
        try {
            if ($this->s3Service->fileExists($tempS3Key)) {
                $this->s3Service->deleteFile($tempS3Key);
            }
        } catch (\Exception $e) {
            // Log error but don't throw - file cleanup is not critical
            error_log("Failed to delete temp file {$tempS3Key}: " . $e->getMessage());
        }
    }

    /**
     * Move validated temp file to permanent location.
     * File is already validated, so no Lambda processing needed.
     *
     * @param Material $material Material entity
     * @param string $tempS3Key Temporary S3 key
     * @param string $originalFileName Original filename
     * @param array|null $extractedFiles Already extracted files from validation
     * @throws \RuntimeException
     */
    public function moveTempArchive(
        Material $material,
        string $tempS3Key,
        string $originalFileName,
        ?array $extractedFiles = null
    ): void {
        try {
            // Generate permanent S3 key
            $permanentKey = $this->generateArchiveKey($material->getToken(), $originalFileName);

            // Copy file from temp to permanent location
            $this->copyS3File($tempS3Key, $permanentKey);

            // Delete temp file
            $this->s3Service->deleteFile($tempS3Key);

            // Update material with archive info and extracted files
            $material->setArchiveS3Key($permanentKey);
            $material->setArchiveS3Bucket($this->s3Service->getBucket());
            $material->setArchiveStatus(self::STATUS_VALIDATED);
            $material->setArchiveValidationError(null);

            // Set extracted files if provided
            if ($extractedFiles !== null) {
                $material->setFiles($extractedFiles);
            }

            $this->em->persist($material);
            $this->em->flush();

        } catch (\Exception $e) {
            // Clean up on failure
            if (isset($permanentKey) && $this->s3Service->fileExists($permanentKey)) {
                $this->s3Service->deleteFile($permanentKey);
            }

            throw new \RuntimeException(
                'Failed to move validated archive: ' . $e->getMessage(),
                0,
                $e
            );
        }
    }

    /**
     * Get presigned upload URL for direct client upload.
     *
     * @throws \RuntimeException
     */
    public function getPresignedUploadUrl(string $key, ?int $expirationSeconds = null, ?string $md5 = null): string
    {
        return $this->s3Service->getPresignedUploadUrl($key, 'application/zip', $expirationSeconds, $md5);
    }

    /**
     * Get S3 bucket name.
     */
    public function getBucket(): string
    {
        return $this->s3Service->getBucket();
    }

    /**
     * Move uploaded file from temporary S3 location to permanent material location.
     * Then trigger Lambda validation.
     *
     * @throws \RuntimeException
     */
    public function moveAndProcessTempArchive(
        Material $material,
        string $tempS3Key,
        string $originalFileName
    ): void {
        try {
            // Verify temp file exists
            if (!$this->s3Service->fileExists($tempS3Key)) {
                throw new \RuntimeException('Temporary file not found in S3');
            }

            // Generate permanent S3 key
            $permanentKey = $this->generateArchiveKey($material->getToken(), $originalFileName);

            // Copy file from temp to permanent location
            // AWS SDK doesn't have a direct copy method in our service, so we'll use copyObject
            $this->copyS3File($tempS3Key, $permanentKey);

            // Delete temp file
            $this->s3Service->deleteFile($tempS3Key);

            // Update material with archive info
            $material->setArchiveS3Key($permanentKey);
            $material->setArchiveS3Bucket($this->s3Service->getBucket());
            $material->setArchiveStatus(self::STATUS_PROCESSING);
            $material->setArchiveValidationError(null);

            $this->em->persist($material);
            $this->em->flush();

            // Trigger Lambda validation
            $this->processArchive($material);

        } catch (\Exception $e) {
            // Clean up on failure
            if (isset($permanentKey) && $this->s3Service->fileExists($permanentKey)) {
                $this->s3Service->deleteFile($permanentKey);
            }

            // Update material status
            $material->setArchiveStatus(self::STATUS_FAILED);
            $material->setArchiveValidationError($e->getMessage());
            $this->em->persist($material);
            $this->em->flush();

            throw new \RuntimeException('Failed to process uploaded archive: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Copy file within S3 bucket using native S3 copy operation.
     *
     * @throws \RuntimeException
     */
    private function copyS3File(string $sourceKey, string $destinationKey): void
    {
        try {
            // Use S3's native copyObject - efficient, no download/upload needed
            $this->s3Service->copyFile($sourceKey, $destinationKey);
        } catch (\Exception $e) {
            throw new \RuntimeException(
                "Failed to copy file in S3: {$e->getMessage()}",
                0,
                $e
            );
        }
    }
}