<?php

declare(strict_types=1);

namespace App\Service\File;

/**
 * Base exception for all file-related errors (S3, Lambda, CDN).
 */
class FileException extends \RuntimeException
{
}