<?php

declare(strict_types=1);

namespace App\Service\File;

/**
 * Exception for invalid archive files.
 */
class InvalidArchiveException extends FileException
{
    public static function invalidFileType(string $actualType): self
    {
        return new self("Invalid file type: {$actualType}. Only ZIP archives are allowed");
    }

    public static function fileTooLarge(int $size, int $maxSize): self
    {
        $sizeMB = round($size / (1024 * 1024), 2);
        $maxSizeMB = $maxSize / (1024 * 1024);
        return new self("File too large: {$sizeMB} MB. Maximum size is {$maxSizeMB} MB");
    }

    public static function invalidExtension(string $extension): self
    {
        return new self("Invalid file extension: {$extension}. Only .zip files are allowed");
    }

    public static function uploadFailed(string $error): self
    {
        return new self("File upload failed: {$error}");
    }

    public static function sizeMismatch(int $uploaded, int $expected): self
    {
        return new self("File size mismatch: uploaded {$uploaded} bytes, expected {$expected} bytes");
    }

    public static function notFoundInTempStorage(): self
    {
        return new self('Uploaded file not found in temporary storage');
    }
}