<?php

declare(strict_types=1);

namespace App\Response\Api\Material;

use App\Entity\Material\Material;
use App\Response\Api\User\BasicUserResponse;

/**
 * Response DTO for GET /api/material/{token} endpoint.
 *
 * Explicitly defines which material fields are exposed in the API response.
 * This provides better security by whitelisting fields and prevents accidental
 * exposure of sensitive data.
 */
readonly class GetMaterialResponse
{
    /**
     * @param array<array{key: string, name: string, size: int, type: string, keyPreview?: string, keyThumbnail?: string}> $files
     */
    public function __construct(
        public string $token,
        public ?BasicUserResponse $user,
        public bool $active,
        public string $title,
        public string $logo,
        public ?string $logoUrl,
        public string $description,
        public ?float $price,
        public int $viewCount,
        public bool $hasBlockchainProof,
        public ?string $archiveStatus,
        public ?string $archiveValidationError,
        public array $files,
        public \DateTimeInterface $createdAt,
        public \DateTimeInterface $updatedAt,
    ) {}

    /**
     * Create response from Material entity.
     *
     * @param string|null $logoUrl Pre-computed CDN URL for the logo
     */
    public static function fromMaterial(Material $material, ?string $logoUrl): self
    {
        return new self(
            token: $material->getToken(),
            user: BasicUserResponse::fromUser($material->getUser()),
            active: $material->isActive(),
            title: $material->getTitle(),
            logo: $material->getLogo(),
            logoUrl: $logoUrl,
            description: $material->getDescription(),
            price: $material->getPrice(),
            viewCount: $material->getViewCount(),
            hasBlockchainProof: $material->hasBlockchainProof(),
            archiveStatus: $material->getArchiveStatus(),
            archiveValidationError: $material->getArchiveValidationError(),
            files: $material->getFiles() ?? [],
            createdAt: $material->getCreatedAt(),
            updatedAt: $material->getUpdatedAt(),
        );
    }
}