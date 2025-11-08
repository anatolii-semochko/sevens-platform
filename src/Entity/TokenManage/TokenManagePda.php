<?php

namespace App\Entity\TokenManage;

use App\Entity\Token\SevensToken;

class TokenManagePda
{
    private string $mint;
    private string $owner;
    private bool $onSale;
    private float $price;
    private float $retailPrice;
    private int $saleFee;
    private bool $mintedThroughManagement;
    private string $lastOperation;
    private \DateTime $lastOperationTimestamp;

    public function __construct(array $data)
    {
        $this->mint = $data['mint'];
        $this->owner = $data['owner'];
        $this->onSale = $data['onSale'];
        $this->price = (float) ($data['price'] ?? 0);
        $this->retailPrice = (float) ($data['retailPrice'] ?? 0);
        $this->saleFee = (int) ($data['saleFee'] ?? 0);
        $this->mintedThroughManagement = $data['mintedThroughManagement'];
        $this->lastOperation = $data['lastOperation'];
        $this->lastOperationTimestamp = new \DateTime()->setTimestamp((int)$data['lastOperationTimestamp']);
    }

    public function getMint(): string
    {
        return $this->mint;
    }

    public function getOwner(): string
    {
        return $this->owner;
    }

    public function isOnSale(): bool
    {
        return $this->onSale;
    }

    public function getPrice(): float
    {
        return $this->price;
    }

    public function getRetailPrice(): float
    {
        return $this->retailPrice;
    }

    public function getSaleFee(): int
    {
        return $this->saleFee;
    }

    public function isMintedThroughManagement(): bool
    {
        return $this->mintedThroughManagement;
    }

    public function getLastOperation(): string
    {
        return $this->lastOperation;
    }

    public function getLastOperationTimestamp(): \DateTime
    {
        return $this->lastOperationTimestamp;
    }
}
