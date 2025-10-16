<?php

namespace App\Service\Blockchain;

use App\Entity\Wallet\WalletSignature;
use App\Service\NodeServer\NodeServerApiClient;
use InvalidArgumentException;

readonly class WalletService
{
    public function __construct(
        private NodeServerApiClient $nodeServerApiClient,
    ) {}

    public function verifyWalletSignature(WalletSignature $walletSignature): void
    {
        try {
            $response = $this->nodeServerApiClient->validateSignature(
                $walletSignature->getWalletPublicKey(),
                $walletSignature->getSignature(),
                $walletSignature->geNonce(),
            );

            if (!isset($response['success']) || !$response['success']) {
                throw new InvalidArgumentException('Authentication failed');
            }

            if (!isset($response['data']['authenticated']) || !$response['data']['authenticated']) {
                throw new InvalidArgumentException('Wallet not authenticated');
            }
        } catch (\Throwable $e) {
            throw new InvalidArgumentException('Wallet signature verification failed.');
        }
    }

    public function getSignatureFromArray(?array $data): ?WalletSignature
    {
        if (!$data) {
            return null;
        }

        if (empty($data['walletPublicKey'])) {
            throw new \InvalidArgumentException('Wallet public key not specified.');
        }
        if (empty($data['nonce'])) {
            throw new \InvalidArgumentException('Wallet nonce not specified.');
        }
        if (empty($data['message'])) {
            throw new \InvalidArgumentException('Wallet message not specified.');
        }
        if (empty($data['signature'])) {
            throw new \InvalidArgumentException('Wallet signature not specified.');
        }

        return new WalletSignature($data['walletPublicKey'], $data['nonce'], $data['message'], $data['signature']);
    }
}
