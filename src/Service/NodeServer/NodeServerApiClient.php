<?php

namespace App\Service\NodeServer;

readonly class NodeServerApiClient extends NodeServerApi
{
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
        return $this->get('/sevens-token', [
            'publicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTokenAgeMinutes(string $tokenPublicKey): array
    {
        return $this->get('/sevens-token/age-minutes', [
            'publicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getSaleTokenTransaction(string $tokenPublicKey, int $price): array
    {
        return $this->get('/manage/sale', [
            'tokenPublicKey' => $tokenPublicKey,
            'price' => $price,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBuyTokenTransaction(string $tokenPublicKey, string $buyerPublicKey): array
    {
        return $this->get('/manage/buy', [
            'tokenPublicKey' => $tokenPublicKey,
            'buyerPublicKey' => $buyerPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBurnTokenTransaction(string $tokenPublicKey): array
    {
        return $this->get('/sevens-token/get-burn-transaction', [
            'tokenPublicKey' => $tokenPublicKey,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function sendSignedTransaction(string $txSignature): array
    {
        return $this->post('/transaction/send', [
            'txSignature' => $txSignature,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function matchTransactionAndSignature(string $transaction, string $txSignature): array
    {
        return $this->post('/transaction/match', [
            'transaction' => $transaction,
            'txSignature' => $txSignature,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTariffs(): array
    {
        return $this->get('/tariffs', null);
    }
}
