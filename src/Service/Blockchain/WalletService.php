<?php

namespace App\Service\Blockchain;

use App\Service\NodeServer\NodeServerApiClient;
use InvalidArgumentException;

class WalletService
{
    public function __construct(
        private NodeServerApiClient $nodeServerApiClient,
    ) {}

    public function verifyWalletSignature(string $walletPublicKey, string $signature, string $nonce): void
    {
        try {
            $result = $this->nodeServerApiClient->validateSignature($walletPublicKey, $signature, $nonce)['data'];
            if (!$result['authenticated']) {
                throw new InvalidArgumentException();
            }
        } catch (\Throwable $e) {
            throw new InvalidArgumentException('Wallet signature verification failed');
        }
    }
}
