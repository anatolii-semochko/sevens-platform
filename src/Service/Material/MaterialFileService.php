<?php

declare(strict_types=1);

namespace App\Service\Material;

use App\Entity\Material\Material;
use App\Repository\Material\MaterialRepository;
use App\Repository\Token\TokenRepository;
use App\Service\File\CdnService;
use App\Service\File\InvalidArchiveException;
use App\Service\File\LambdaException;
use App\Service\File\LambdaService;
use App\Service\File\S3Exception;
use App\Service\File\S3Service;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

readonly class MaterialFileService
{
    // Archive status constants
    public const string STATUS_PENDING = 'pending';
    public const string STATUS_PROCESSING = 'processing';
    public const string STATUS_VALIDATED = 'validated';
    public const string STATUS_FAILED = 'failed';

    // File size limits
    private const int MAX_ARCHIVE_SIZE = 100 * 1024 * 1024; // 100 MB

    // Presigned URL expiration
    private const int PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

    public function __construct(
        private EntityManagerInterface $em,
        private S3Service $s3Service,
        private LambdaService $lambdaService,
        private CdnService $cdnService,
        private LoggerInterface $logger,
        private TokenRepository $tokenRepository,
        private MaterialRepository $materialRepository,
    ) {}

    /**
     * Prepare presigned upload URL for new material creation.
     *
     * SECURITY:
     * 1. Validates token exists in blockchain
     * 2. Checks material doesn't already exist for this token
     * 3. Generates presigned URL with blockchain hash validation
     *
     * @param string $tokenPublicKey Token public key from blockchain
     * @param string $fileName Original filename
     * @param string|null $containerMd5 MD5 hash (deprecated, optional)
     * @return array{uploadUrl: string, tempS3Key: string, bucket: string, expectedHash: string, expiresAt: int, expiresIn: int}
     * @throws \App\Exception\NotFoundException If token not found in blockchain
     * @throws \InvalidArgumentException If material already exists for this token
     * @throws \RuntimeException On S3/URL generation failure
     */
    public function preparePresignedUploadForToken(
        string $tokenPublicKey,
        string $fileName,
        ?string $containerMd5 = null
    ): array {
        // Validate token exists in blockchain
        $blockchainToken = $this->tokenRepository->get($tokenPublicKey);

        // Check if material already exists for this token
        if ($this->materialRepository->findOneBy(['token' => $tokenPublicKey])) {
            throw new MaterialAlreadyExistsException($tokenPublicKey);
        }

        // Generate temporary S3 key with UUID
        $uuid = Uuid::v4()->toString();
        $sanitizedFileName = $this->sanitizeFilename($fileName);
        $tempS3Key = sprintf('materials/temp/%s/%s', $uuid, $sanitizedFileName);

        // Get blockchain hash (immutable, trusted source)
        $expectedHash = $blockchainToken->getHash();

        // Generate presigned upload URL (S3 will validate SHA-256 hash)
        $uploadUrl = $this->getPresignedUploadUrl(
            $tempS3Key,
            self::PRESIGNED_URL_EXPIRATION,
            $containerMd5,
            $expectedHash
        );

        return [
            'uploadUrl' => $uploadUrl,
            'tempS3Key' => $tempS3Key,
            'bucket' => $this->getBucket(),
            'expectedHash' => $expectedHash,
            'expiresAt' => time() + self::PRESIGNED_URL_EXPIRATION,
            'expiresIn' => self::PRESIGNED_URL_EXPIRATION,
        ];
    }

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
            throw MaterialValidationException::archiveNotUploaded();
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
                $material->setFiles($result['files'] ?? []);
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

            throw LambdaException::archiveProcessingFailed($e->getMessage());
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
            throw MaterialValidationException::archiveNotValidated();
        }

        $files = $material->getFiles();
        if (!$files) {
            throw MaterialValidationException::noFilesAvailable();
        }

        // Extract available file keys
        $availableKeys = array_column($files, 'key');

        // Validate that all selected keys exist in available files
        $invalidKeys = array_diff($selectedImageKeys, $availableKeys);
        if (!empty($invalidKeys)) {
            throw MaterialValidationException::invalidFileKeys($invalidKeys);
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
     * Get presigned download URL for material archive.
     *
     * @throws \RuntimeException
     */
    public function getArchiveDownloadUrl(Material $material, ?int $expirationSeconds = null): string
    {
        if (!$material->getArchiveS3Key()) {
            throw MaterialValidationException::missingArchive();
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
            throw InvalidArchiveException::uploadFailed($file->getErrorMessage());
        }

        // Check MIME type
        $allowedMimeTypes = ['application/zip', 'application/x-zip-compressed'];
        if (!in_array($file->getMimeType(), $allowedMimeTypes, true)) {
            throw InvalidArchiveException::invalidFileType($file->getMimeType());
        }

        // Check file size
        if ($file->getSize() > self::MAX_ARCHIVE_SIZE) {
            throw InvalidArchiveException::fileTooLarge($file->getSize(), self::MAX_ARCHIVE_SIZE);
        }

        // Check file extension
        if (strtolower($file->getClientOriginalExtension()) !== 'zip') {
            throw InvalidArchiveException::invalidExtension($file->getClientOriginalExtension());
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
     * Invokes Lambda to verify hash and size only (does not extract files).
     *
     * @param string $tempS3Key S3 key of uploaded temp file
     * @param \App\Entity\Token\SevensTokenContainer $expectedContainer Expected container metadata
     * @return array{success: bool, error?: string}
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

            // Invoke Lambda for hash validation only (skip file extraction during validation)
            $result = $this->lambdaService->validateMaterialArchive(
                $this->s3Service->getBucket(),
                $tempS3Key,
                'validation-only', // Special token to indicate validation-only mode
                [
                    'hash' => $expectedContainer->getHash(),
                    'size' => $expectedContainer->getSize(),
                    'name' => $expectedContainer->getName(),
                    'validateOnly' => true, // Skip file extraction during validation
                ]
            );

            return $result;

        } catch (\Exception $e) {
            throw LambdaException::containerValidationFailed($e->getMessage());
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
            $this->logger->warning("Failed to delete temp file {$tempS3Key}: " . $e->getMessage(), [
                'exception' => $e,
                'tempS3Key' => $tempS3Key,
            ]);
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

            throw S3Exception::copyFailed($tempS3Key, $permanentKey, $e->getMessage());
        }
    }

    /**
     * Get presigned upload URL for direct client upload.
     *
     * @param string $key S3 key for the file
     * @param int|null $expirationSeconds URL expiration in seconds
     * @param string|null $md5 Base64-encoded MD5 hash (deprecated)
     * @param string|null $sha256Hash Hex-encoded SHA-256 hash from blockchain for AWS validation
     * @throws \RuntimeException
     */
    public function getPresignedUploadUrl(
        string $key,
        ?int $expirationSeconds = null,
        ?string $md5 = null,
        ?string $sha256Hash = null
    ): string {
        return $this->s3Service->getPresignedUploadUrl(
            $key,
            'application/zip',
            $expirationSeconds,
            $md5,
            $sha256Hash
        );
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
                throw S3Exception::fileNotFound($tempS3Key);
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

            throw LambdaException::archiveProcessingFailed($e->getMessage());
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
            throw S3Exception::copyFailed($sourceKey, $destinationKey, $e->getMessage());
        }
    }
}