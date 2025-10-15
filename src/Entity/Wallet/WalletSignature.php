<?php

namespace App\Entity\Wallet;

class WalletSignature
{
    private string $walletPublicKey;
    private string $nonce;
    private string $message;
    private string $signature;

    public function __construct(array $walletSignatureData)
    {
        if (empty($walletSignatureData['walletPublicKey'])) {
            throw new \InvalidArgumentException('Wallet public key not specified.');
        }
        if (empty($walletSignatureData['nonce'])) {
            throw new \InvalidArgumentException('Wallet nonce not specified.');
        }
        if (empty($walletSignatureData['message'])) {
            throw new \InvalidArgumentException('Wallet message not specified.');
        }
        if (empty($walletSignatureData['signature'])) {
            throw new \InvalidArgumentException('Wallet signature not specified.');
        }

        $this->walletPublicKey = $walletSignatureData['walletPublicKey'];
        $this->nonce = $walletSignatureData['nonce'];
        $this->message = $walletSignatureData['message'];
        $this->signature = $walletSignatureData['signature'];
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
