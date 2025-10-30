<?php

namespace App\Entity\TokenManage;

use App\Entity\Token\SevensToken;

class TokenManageTariffsPda
{
    private string $authority;
    private string $targetWallet;
    private int $mint;
    private int $setSale;
    private int $buy;
    private int $burn;
    private bool $paused;

    public function __construct(array $data)
    {
        $this->authority = $data['authority'];
        $this->targetWallet = $data['targetWallet'];
        $this->mint = $data['mint'] ? $data['mint'] / SevensToken::LAMPORTS_PER_SOL : 0;
        $this->setSale = $data['setSale'] ? $data['setSale'] / SevensToken::LAMPORTS_PER_SOL : 0 ;
        $this->buy = $data['buy'] ? $data['buy'] / SevensToken::LAMPORTS_PER_SOL : 0;
        $this->burn = $data['burn'] ? $data['burn'] / SevensToken::LAMPORTS_PER_SOL : 0;
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

    public function getMint(): int
    {
        return $this->mint;
    }

    public function getSetSale(): int
    {
        return $this->setSale;
    }

    public function getBuy(): int
    {
        return $this->buy;
    }

    public function getBurn(): int
    {
        return $this->burn;
    }

    public function isPaused(): bool
    {
        return $this->paused;
    }
}
