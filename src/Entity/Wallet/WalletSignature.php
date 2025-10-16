<?php

namespace App\Entity\Wallet;

class WalletSignature
{
    private string $walletPublicKey;
    private string $nonce;
    private string $message;
    private string $signature;

    public function __construct(
        string $walletPublicKey,
        string $nonce,
        string $message,
        string $signature
    ) {
        $this->walletPublicKey = $walletPublicKey;
        $this->nonce = $nonce;
        $this->message = $message;
        $this->signature = $signature;
    }

    public function getWalletPublicKey(): string
    {
        return $this->walletPublicKey;
    }

    public function geNonce(): string
    {
        return $this->nonce;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getSignature(): string
    {
        return $this->signature;
    }
}
