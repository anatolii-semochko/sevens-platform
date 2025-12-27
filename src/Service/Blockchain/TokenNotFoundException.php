<?php

declare(strict_types=1);

namespace App\Service\Blockchain;

/**
 * Exception thrown when a blockchain token is not found.
 */
class TokenNotFoundException extends BlockchainException
{
    public function __construct(string $tokenPublicKey)
    {
        parent::__construct("Token '{$tokenPublicKey}' not found on blockchain");
    }

    public static function byPublicKey(string $tokenPublicKey): self
    {
        return new self($tokenPublicKey);
    }
}