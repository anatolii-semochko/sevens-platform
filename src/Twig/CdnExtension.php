<?php

declare(strict_types=1);

namespace App\Twig;

use App\Service\File\CdnService;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

/**
 * Twig extension for CDN URL generation.
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
}