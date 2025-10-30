<?php

namespace App\Entity\TokenManage;

enum ManageTransactionTypeEnum: string
{
    case TOKEN_MINT = 'token-mint';
    case TOKEN_SALE = 'token-sale';
    case TOKEN_BUY = 'token-buy';
    case TOKEN_BURN = 'token-burn';
}
