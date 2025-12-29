<?php

declare(strict_types=1);

namespace App\Response\Api\User;

use App\Entity\User;

/**
 * Basic user information DTO for API responses.
 * Contains minimal user data for displaying authorship/ownership.
 */
readonly class BasicUserResponse
{
    public function __construct(
        public string $id,
        public ?string $firstName,
        public ?string $lastName,
    ) {}

    /**
     * Create BasicUserResponse from User entity.
     * Returns null if user is null (for anonymous/system actions).
     */
    public static function fromUser(?User $user): ?self
    {
        if (!$user) {
            return null;
        }

        return new self(
            id: $user->getId(),
            firstName: $user->getFirstName(),
            lastName: $user->getLastName(),
        );
    }

    /**
     * Get full name of the user.
     * Returns 'Anonymous' if no name is available.
     */
    public function getFullName(): string
    {
        return trim(($this->firstName ?? '') . ' ' . ($this->lastName ?? '')) ?: 'Anonymous';
    }
}