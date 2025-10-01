<?php

namespace App\Entity\Token;

class SevensToken
{
    private string $tokenPublicKey;
    private string $walletPublicKey;
    private \DateTime $mintingTimestamp;
    private string $name;
    private string $author;
    private string $description;
    private string $hash;
    private bool $isOnSale;
    private float $price;

    public function __construct(
        string $tokenPublicKey,
        string $walletPublicKey,
        \DateTime $mintingTimestamp,
        string $name,
        string $author,
        string $description,
        string $hash,
        bool $isOnSale,
        float $price,
    ){
        $this->tokenPublicKey = $tokenPublicKey;
        $this->walletPublicKey = $walletPublicKey;
        $this->mintingTimestamp = $mintingTimestamp;
        $this->name = $name;
        $this->author = $author;
        $this->description = $description;
        $this->hash = $hash;
        $this->isOnSale = $isOnSale;
        $this->price = $price;
    }

    public function getTokenPublicKey(): string
    {
        return $this->tokenPublicKey;
    }

    public function getWalletPublicKey(): string
    {
        return $this->walletPublicKey;
    }

    public function getMintingTime(): \DateTime
    {
        return $this->mintingTimestamp;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getAuthor(): string
    {
        return $this->author;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getHash(): string
    {
        return $this->hash;
    }

    public function isOnSale(): bool
    {
        return $this->isOnSale;
    }

    public function getPrice(): float
    {
        return $this->price;
    }
}
