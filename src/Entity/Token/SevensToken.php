<?php

namespace App\Entity\Token;

use Symfony\Component\Serializer\Annotation\Groups;

class SevensToken
{
    #[Groups(['sevens-token:read'])]
    private string $tokenPublicKey;
    private \DateTime $mintingTimestamp;
    #[Groups(['sevens-token:read'])]
    private string $name;
    #[Groups(['sevens-token:read'])]
    private string $author;
    #[Groups(['sevens-token:read'])]
    private string $description;
    #[Groups(['sevens-token:read'])]
    private string $hash;
    #[Groups(['sevens-token:read'])]
    private ?string $walletPublicKey;
    #[Groups(['sevens-token:read'])]
    private ?bool $isOnSale;
    #[Groups(['sevens-token:read'])]
    private ?float $price;

    public function __construct(
        string $tokenPublicKey,
        \DateTime $mintingTimestamp,
        string $name,
        string $author,
        string $description,
        string $hash,
        ?string $walletPublicKey = null,
        ?bool $isOnSale = null,
        ?float $price = null,
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

    public function getWalletPublicKey(): ?string
    {
        return $this->walletPublicKey;
    }

    public function getMintingTime(): \DateTime
    {
        return $this->mintingTimestamp;
    }

    public function getMintingTimeText(): string
    {
        return $this->mintingTimestamp->format('Y-m-d');
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

    public function isOnSale(): ?bool
    {
        return $this->isOnSale;
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function getBlockchainTokenUrl(): string
    {
        return str_replace('{tokenPublicKey}', $this->tokenPublicKey, $_ENV['TOKEN_BLOCKCHAIN_URL']);
    }
}
