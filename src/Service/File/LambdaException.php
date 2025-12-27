<?php

declare(strict_types=1);

namespace App\Service\File;

/**
 * Base exception for all AWS Lambda-related errors.
 */
class LambdaException extends FileException
{
    public static function validationFailed(string $error): self
    {
        return new self("Lambda validation failed: {$error}");
    }

    public static function invocationFailed(string $error): self
    {
        return new self("Lambda invocation failed: {$error}");
    }

    public static function archiveProcessingFailed(string $error): self
    {
        return new self("Failed to process archive: {$error}");
    }

    public static function containerValidationFailed(string $error): self
    {
        return new self("Container validation failed: {$error}");
    }
}