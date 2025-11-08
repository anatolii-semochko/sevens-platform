<?php

namespace App\Entity\Wallet;

enum WalletTransactionTypeEnum: string
{
    case TOKEN_MINT = 'token-mint';
    case TOKEN_SALE = 'token-sale';
    case TOKEN_BUY = 'token-buy';
    case TOKEN_BURN = 'token-burn';
    case BACKOFFICE = 'backoffice';
}
