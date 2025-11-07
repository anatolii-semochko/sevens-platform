<?php

declare(strict_types=1);

namespace App\Service\File;

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

readonly class S3Service
{
    private S3Client $s3Client;
    private string $bucket;
    private int $presignedExpiration;
    private ?string $publicEndpoint;

    public function __construct(
        private ParameterBagInterface $params
    ) {
        $config = [
            'version' => 'latest',
            'region' => $this->params->get('aws.region'),
            'credentials' => [
                'key' => $this->params->get('aws.access_key_id'),
                'secret' => $this->params->get('aws.secret_access_key'),
            ],
        ];

        // Add endpoint for LocalStack
        if ($endpoint = $this->params->get('aws.endpoint')) {
            $config['endpoint'] = $endpoint;
            $config['use_path_style_endpoint'] = $this->params->get('aws.use_path_style_endpoint');
        }

        $this->s3Client = new S3Client($config);
        $this->bucket = $this->params->get('aws.s3.materials_bucket');
        $this->presignedExpiration = (int) $this->params->get('aws.s3.presigned_expiration');

        // Public endpoint for presigned URLs (browser-accessible, not internal Docker hostname)
        $this->publicEndpoint = $this->params->get('aws.s3.public_endpoint') ?: null;
    }

    /**
     * Upload a file to S3.
     *
     * @throws \RuntimeException
     */
    public function uploadFile(UploadedFile $file, string $key): string
    {
        try {
            $this->s3Client->putObject([
                'Bucket' => $this->bucket,
                'Key' => $key,
                'Body' => fopen($file->getPathname(), 'r'),
                'ContentType' => $file->getMimeType() ?? 'application/octet-stream',
            ]);

            return $key;
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to upload file to S3: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Upload file from string content.
     *
     * @throws \RuntimeException
     */
    public function uploadFromString(string $content, string $key, string $contentType = 'application/octet-stream'): string
    {
        try {
            $this->s3Client->putObject([
                'Bucket' => $this->bucket,
                'Key' => $key,
                'Body' => $content,
                'ContentType' => $contentType,
            ]);

            return $key;
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to upload content to S3: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Get a presigned URL for downloading a file.
     *
     * @throws \RuntimeException
     */
    public function getPresignedDownloadUrl(string $key, ?int $expirationSeconds = null): string
    {
        try {
            $cmd = $this->s3Client->getCommand('GetObject', [
                'Bucket' => $this->bucket,
                'Key' => $key,
            ]);

            $request = $this->s3Client->createPresignedRequest(
                $cmd,
                "+{$expirationSeconds} seconds" ?? "+{$this->presignedExpiration} seconds"
            );

            $url = (string) $request->getUri();

            // Replace internal endpoint with public endpoint for browser access
            return $this->replaceWithPublicEndpoint($url);
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to generate presigned URL: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Get a presigned URL for uploading a file.
     * Client can upload directly to S3 using this URL with a PUT request.
     *
     * @throws \RuntimeException
     */
    public function getPresignedUploadUrl(
        string $key,
        string $contentType = 'application/zip',
        ?int $expirationSeconds = null,
        ?string $md5 = null
    ): string {
        try {
            $params = [
                'Bucket' => $this->bucket,
                'Key' => $key,
                'ContentType' => $contentType,
            ];

            // Add Content-MD5 if provided (S3 will validate on upload)
            if ($md5 !== null) {
                $params['ContentMD5'] = $md5;
            }

            $cmd = $this->s3Client->getCommand('PutObject', $params);

            $request = $this->s3Client->createPresignedRequest(
                $cmd,
                "+{$expirationSeconds} seconds" ?? "+{$this->presignedExpiration} seconds"
            );

            $url = (string) $request->getUri();

            // Replace internal endpoint with public endpoint for browser access
            return $this->replaceWithPublicEndpoint($url);
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to generate presigned upload URL: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Replace internal Docker endpoint with public browser-accessible endpoint.
     */
    private function replaceWithPublicEndpoint(string $url): string
    {
        if (!$this->publicEndpoint) {
            return $url;
        }

        // Parse the URL
        $parsedUrl = parse_url($url);

        // Replace the scheme and host with public endpoint
        $publicParsed = parse_url($this->publicEndpoint);

        $newUrl = sprintf(
            '%s://%s%s%s%s',
            $publicParsed['scheme'] ?? 'https',
            $publicParsed['host'] ?? 'localhost',
            isset($publicParsed['port']) ? ':' . $publicParsed['port'] : '',
            $publicParsed['path'] ?? '/s3',
            $parsedUrl['path'] ?? ''
        );

        // Append query string if exists
        if (isset($parsedUrl['query'])) {
            $newUrl .= '?' . $parsedUrl['query'];
        }

        return $newUrl;
    }

    /**
     * Delete a file from S3.
     *
     * @throws \RuntimeException
     */
    public function deleteFile(string $key): void
    {
        try {
            $this->s3Client->deleteObject([
                'Bucket' => $this->bucket,
                'Key' => $key,
            ]);
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to delete file from S3: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Check if a file exists in S3.
     */
    public function fileExists(string $key): bool
    {
        return $this->s3Client->doesObjectExist($this->bucket, $key);
    }

    /**
     * Get file metadata.
     *
     * @return array<string, mixed>
     * @throws \RuntimeException
     */
    public function getFileMetadata(string $key): array
    {
        try {
            $result = $this->s3Client->headObject([
                'Bucket' => $this->bucket,
                'Key' => $key,
            ]);

            return [
                'size' => $result['ContentLength'],
                'contentType' => $result['ContentType'],
                'lastModified' => $result['LastModified'],
                'etag' => $result['ETag'],
            ];
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to get file metadata: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Get the public URL for a file (when bucket is public or CDN is used).
     */
    public function getPublicUrl(string $key): string
    {
        return $this->s3Client->getObjectUrl($this->bucket, $key);
    }

    /**
     * Get the S3 bucket name.
     */
    public function getBucket(): string
    {
        return $this->bucket;
    }

    /**
     * Copy a file within the same S3 bucket.
     *
     * @throws \RuntimeException
     */
    public function copyFile(string $sourceKey, string $destinationKey): void
    {
        try {
            $this->s3Client->copyObject([
                'Bucket' => $this->bucket,
                'CopySource' => $this->bucket . '/' . $sourceKey,
                'Key' => $destinationKey,
            ]);
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to copy file in S3: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }
}