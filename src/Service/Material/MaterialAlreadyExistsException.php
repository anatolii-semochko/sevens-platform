<?php

declare(strict_types=1);

namespace App\Service\Material;

class MaterialAlreadyExistsException extends MaterialException
{
    public function __construct(string $tokenPublicKey)
    {
        parent::__construct("Material already exists for token '{$tokenPublicKey}'");
    }
}
