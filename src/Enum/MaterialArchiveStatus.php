<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * Material archive processing status.
 * Tracks the lifecycle of material archive from upload to validation.
 */
enum MaterialArchiveStatus: string
{
    /** Archive uploaded and validated, files extracted successfully */
    case VALIDATED = 'validated';

    /** Archive validation or file extraction failed */
    case FAILED = 'failed';

    /** Archive is being validated by Lambda */
    case VALIDATING = 'validating';

    /** Archive validated, files are being extracted */
    case EXTRACTING_FILES = 'extracting_files';

    /** Material created, waiting for archive upload (future use) */
    case PENDING_UPLOAD = 'pending_upload';
}