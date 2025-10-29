<?php

namespace App\Entity\TokenManage;

class TokenManageTariffsPda
{
    private string $authority;
    private string $targetWallet;
    private int $mint;
    private int $setSale;
    private int $buy;
    private int $burn;
    private bool $paused;
}
