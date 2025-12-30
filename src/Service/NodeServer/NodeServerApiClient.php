<?php

namespace App\Service\NodeServer;

readonly class NodeServerApiClient extends NodeServerApi
{
    /**
     * @throws NodeServerApiException
     */
    public function getRate(): float
    {
        $response = $this->get('/rate');

        return $response['rate'];
    }

    /**
     * @throws NodeServerApiException
     */
    public function getWalletBalance(string $walletAddress): float
    {
        return $this->get('/wallet/balance', [
            'walletAddress' => $walletAddress,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function fetchNonce(string $walletAddress): array
    {
        return $this->get('/auth/nonce', [
            'walletAddress' => $walletAddress,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function validateSignature(string $walletAddress, string $signature, string $nonce): array
    {
        return $this->post('/auth/verify', [
            'walletAddress' => $walletAddress,
            'signature' => $signature,
            'nonce' => $nonce,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTokenMetadata(string $tokenPublicKey): array
    {
        return $this->get('/hd-token', [
            'publicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTokenMetadataByHash(string $hash): array
    {
        return $this->get('/hd-token', [
            'hash' => $hash,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function fetchTokensByWallet(string $walletPublicKey): array
    {
        return $this->get('/hd-token', [
            'walletPublicKey' => $walletPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getManageTokenData(string $tokenPublicKey): array
    {
        return $this->get('/manage/get-data', [
            'tokenPublicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getManageTokenTariffsData(): ?array
    {
        return $this->get('/manage/tariffs');
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTokenAgeMinutes(string $tokenPublicKey): int
    {
        return $this->get('/hd-token/age-minutes', [
            'publicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getMintTokenTransaction(string $mintPublicKey, array $tokenData): array
    {
        return $this->get('/manage/mint-transaction', [
            'mintPublicKey' => $mintPublicKey,
            'walletPublicKey' => $tokenData['walletPublicKey'],
            'tokenName' => $tokenData['tokenName'],
            'hash' => $tokenData['hash'],
            'author' => $tokenData['author'] ?? '',
            'description' => $tokenData['description'] ?? '',
            'canBeBurned' => (bool) $tokenData['canBeBurned'],
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getSaleTokenTransaction(string $tokenPublicKey, float $price): string
    {
        return $this->get('/manage/sale-transaction', [
            'tokenPublicKey' => $tokenPublicKey,
            'price' => $price,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBuyTokenTransaction(string $tokenPublicKey, string $buyerPublicKey): string
    {
        return $this->get('/manage/buy-transaction', [
            'tokenPublicKey' => $tokenPublicKey,
            'buyerPublicKey' => $buyerPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBurnTokenTransaction(string $tokenPublicKey): string
    {
        return $this->get('/manage/burn-transaction', [
            'tokenPublicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function sendSignedTransaction(string $txSignature): void
    {
        $this->post('/transaction/send', [
            'txSignature' => $txSignature,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function matchTransactionAndSignature(string $transaction, string $txSignature): void
    {
        $this->post('/transaction/match', [
            'transaction' => $transaction,
            'txSignature' => $txSignature,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTariffs(): array
    {
        return $this->get('/manage/tariffs', null);
    }

    /**
     * Emit WebSocket event to all connected clients.
     *
     * @param string $event Event name (e.g., 'material.created')
     * @param array $data Event data
     */
    public function emitWebSocketEvent(string $event, array $data): void
    {
        try {
            $this->post('/websocket/emit', [
                'event' => $event,
                'data' => $data,
            ]);
        } catch (NodeServerApiException $e) {
            // Log error but don't break material creation
            $this->logger->error('WebSocket notification failed', [
                'event' => $event,
                'error' => $e->getMessage(),
                'exception' => $e,
            ]);
            // Don't rethrow - WebSocket failures shouldn't break material creation
        }
    }
}
