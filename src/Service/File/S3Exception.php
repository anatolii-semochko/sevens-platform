<?php

declare(strict_types=1);

namespace App\Service\File;

/**
 * Base exception for all S3-related errors.
 */
class S3Exception extends FileException
{
    public static function uploadFailed(string $key, string $error): self
    {
        return new self("Failed to upload file to S3 (key: {$key}): {$error}");
    }

    public static function fileNotFound(string $key): self
    {
        return new self("File not found in S3: {$key}");
    }

    public static function deleteFailed(string $key, string $error): self
    {
        return new self("Failed to delete S3 file (key: {$key}): {$error}");
    }

    public static function copyFailed(string $source, string $destination, string $error): self
    {
        return new self("Failed to copy file in S3 from {$source} to {$destination}: {$error}");
    }

    public static function metadataFetchFailed(string $key, string $error): self
    {
        return new self("Failed to fetch S3 metadata for {$key}: {$error}");
    }
}