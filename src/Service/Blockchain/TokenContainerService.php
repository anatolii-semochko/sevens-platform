<?php

namespace App\Service\Blockchain;

use App\Entity\Token\SevensTokenContainer;

class TokenContainerService
{
    public function getFromArray(array $data): SevensTokenContainer
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Container name not specified.');
        }
        if (empty($data['size'])) {
            throw new \InvalidArgumentException('Container size not specified.');
        }
        if (empty($data['hash'])) {
            throw new \InvalidArgumentException('Container hash not specified.');
        }

        return new SevensTokenContainer($data['name'], $data['size'], $data['hash']);
    }
}
