<?php

namespace App\Entity\TokenManage;

use App\Entity\Token\SevensToken;

class TokenManageTariffsPda
{
    private string $authority;
    private string $targetWallet;
    private float $mint;
    private float $setSale;
    private int $buy;
    private float $burn;
    private bool $paused;

    public function __construct(array $data)
    {
        $this->authority = $data['authority'];
        $this->targetWallet = $data['targetWallet'];
        $this->mint = (float) ($data['mint'] ?? 0);
        $this->setSale = (float) ($data['setSale'] ?? 0);
        $this->buy = (int) ($data['buy'] ?? 0);
        $this->burn = (float) ($data['burn'] ?? 0);
        $this->paused = $data['paused'];
    }

    public function getAuthority(): string
    {
        return $this->authority;
    }

    public function getTargetWallet(): string
    {
        return $this->targetWallet;
    }

    public function getMint(): float
    {
        return $this->mint;
    }

    public function getSetSale(): float
    {
        return $this->setSale;
    }

    public function getBuy(): int
    {
        return $this->buy;
    }

    public function getBurn(): float
    {
        return $this->burn;
    }

    public function isPaused(): bool
    {
        return $this->paused;
    }
}
