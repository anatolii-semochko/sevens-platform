<?php

declare(strict_types=1);

namespace App\Service\File;

use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

readonly class CdnService
{
    private bool $cdnEnabled;
    private string $cdnBaseUrl;

    public function __construct(
        private ParameterBagInterface $params,
        private S3Service $s3Service
    ) {
        $this->cdnEnabled = (bool) $this->params->get('cdn.enabled');
        $this->cdnBaseUrl = $this->params->get('cdn.base_url');
    }

    /**
     * Get CDN URL for an S3 key.
     * Returns CDN URL if enabled, otherwise returns S3 public URL.
     */
    public function getUrl(string $s3Key): string
    {
        if ($this->cdnEnabled) {
            return $this->buildCdnUrl($s3Key);
        }

        // Fallback to S3 public URL
        return $this->s3Service->getPublicUrl($s3Key);
    }

    /**
     * Get CDN URLs for multiple S3 keys.
     *
     * @param array<string> $s3Keys
     * @return array<string>
     */
    public function getUrls(array $s3Keys): array
    {
        return array_map(fn(string $key) => $this->getUrl($key), $s3Keys);
    }

    /**
     * Transform image metadata array to include CDN URLs for all variants.
     * Adds url (original), urlThumbnail, and urlPreview fields.
     *
     * @param array<array{key: string, name: string, size: int, type: string}> $images
     * @return array<array{key: string, name: string, size: int, type: string, url: string, urlThumbnail?: string, urlPreview?: string}>
     */
    public function addUrlsToImages(array $images): array
    {
        return array_map(function (array $image): array {
            // Original URL (always present)
            $image['url'] = $this->getUrl($image['key']);

            // Thumbnail URL (if variant exists)
            if (isset($image['keyThumbnail'])) {
                $image['urlThumbnail'] = $this->getUrl($image['keyThumbnail']);
            }

            // Preview URL (if variant exists)
            if (isset($image['keyPreview'])) {
                $image['urlPreview'] = $this->getUrl($image['keyPreview']);
            }

            return $image;
        }, $images);
    }

    /**
     * Build CDN URL from S3 key.
     */
    private function buildCdnUrl(string $s3Key): string
    {
        // Remove bucket prefix if present in the key
        $cleanKey = $s3Key;

        // Ensure no leading slash in key
        $cleanKey = ltrim($cleanKey, '/');

        // Build full CDN URL
        return rtrim($this->cdnBaseUrl, '/') . '/' . $cleanKey;
    }

    /**
     * Check if CDN is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->cdnEnabled;
    }

    /**
     * Get CDN base URL.
     */
    public function getBaseUrl(): string
    {
        return $this->cdnBaseUrl;
    }
}