<?php

namespace App\Service\Blockchain;

use App\Service\NodeServer\NodeServerApiClient;
use InvalidArgumentException;

readonly class WalletService
{
    public function __construct(
        private NodeServerApiClient $nodeServerApiClient,
    ) {}

    public function verifyWalletSignature(string $walletPublicKey, string $signature, string $nonce): void
    {
        try {
            $response = $this->nodeServerApiClient->validateSignature($walletPublicKey, $signature, $nonce);
            
            if (!isset($response['success']) || !$response['success']) {
                throw new InvalidArgumentException('Authentication failed');
            }
            
            if (!isset($response['data']['authenticated']) || !$response['data']['authenticated']) {
                throw new InvalidArgumentException('Wallet not authenticated');
            }
        } catch (\Throwable $e) {
            throw new InvalidArgumentException('Wallet signature verification failed: ' . $e->getMessage());
        }
    }
}
