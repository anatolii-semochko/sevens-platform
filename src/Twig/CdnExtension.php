<?php

declare(strict_types=1);

namespace App\Twig;

use App\Service\File\CdnService;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

/**
 * Twig extension for CDN URL generation with image variant support.
 */
class CdnExtension extends AbstractExtension
{
    public function __construct(
        private readonly CdnService $cdnService,
    ) {}

    public function getFilters(): array
    {
        return [
            new TwigFilter('cdn_url', [$this, 'getCdnUrl']),
            new TwigFilter('image_url', [$this, 'getImageUrl']),
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('find_file_by_thumbnail', [$this, 'findFileByThumbnail']),
        ];
    }

    /**
     * Convert S3 key to CDN URL.
     * Handles both S3 keys (materials/token/files/file.png) and legacy filenames (file.png).
     */
    public function getCdnUrl(?string $s3Key): ?string
    {
        if (!$s3Key) {
            return null;
        }

        // If it's an S3 key (starts with 'materials/'), use CDN service
        if (str_starts_with($s3Key, 'materials/')) {
            return $this->cdnService->getUrl($s3Key);
        }

        // Legacy filename format - construct old path
        // This shouldn't happen for new materials, but provides backward compatibility
        return null; // Let the template handle legacy paths
    }

    /**
     * Get CDN URL for image with specified variant (thumbnail, preview, or original).
     * All variants are served through CDN, just different file sizes.
     *
     * @param array|null $file File object from database with keys: key, keyPreview, keyThumbnail
     * @param string $variant 'thumbnail' (300px), 'preview' (1200px), or 'original' (full size)
     * @return string|null CDN URL for the requested variant
     */
    public function getImageUrl(?array $file, string $variant = 'preview'): ?string
    {
        if (!$file) {
            return null;
        }

        // Select the appropriate key based on variant, with fallback to original
        $key = match($variant) {
            'thumbnail' => $file['keyThumbnail'] ?? $file['key'],
            'preview' => $file['keyPreview'] ?? $file['key'],
            'original' => $file['key'],
            default => $file['key'],
        };

        return $this->getCdnUrl($key);
    }

    /**
     * Find file object by thumbnail key.
     * Useful for finding the main image file from logo field (which stores thumbnail key).
     *
     * @param array|null $files Array of file objects
     * @param string|null $thumbnailKey The thumbnail key to search for (usually from material.logo)
     * @return array|null The matching file object or null
     */
    public function findFileByThumbnail(?array $files, ?string $thumbnailKey): ?array
    {
        if (!$files || !$thumbnailKey) {
            return null;
        }

        foreach ($files as $file) {
            if (($file['keyThumbnail'] ?? null) === $thumbnailKey) {
                return $file;
            }
        }

        return null;
    }
}