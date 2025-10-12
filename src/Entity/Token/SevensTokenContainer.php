<?php

namespace App\Entity\Token;

class SevensTokenContainer
{
    private string $name;
    private int $size;
    private string $hash;

    public function __construct(
        string $name,
        int $size,
        string $hash,
    ){
        $this->name = $name;
        $this->size = $size;
        $this->hash = $hash;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function getHash(): string
    {
        return $this->hash;
    }
}
