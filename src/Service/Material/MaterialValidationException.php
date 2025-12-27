<?php

declare(strict_types=1);

namespace App\Service\Material;

class MaterialValidationException extends MaterialException
{
    public static function missingTitleForActivation(): self
    {
        return new self('The title is required to activate the publication');
    }

    public static function missingDescriptionForActivation(): self
    {
        return new self('The description is required to activate the publication');
    }

    public static function missingArchive(): self
    {
        return new self('Material does not have an archive');
    }

    public static function archiveNotUploaded(): self
    {
        return new self('Material does not have an archive uploaded');
    }

    public static function archiveNotValidated(): self
    {
        return new self('Archive must be validated before selecting images');
    }

    public static function noFilesAvailable(): self
    {
        return new self('No files available to select from');
    }

    public static function invalidFileKeys(array $invalidKeys): self
    {
        return new self('Invalid file keys selected: ' . implode(', ', $invalidKeys));
    }

    public static function containerVerificationFailed(string $error): self
    {
        return new self('Container verification failed: ' . $error);
    }

    public static function cannotDeleteActiveToken(): self
    {
        return new self("Material can't be removed for active token in blockchain");
    }
}