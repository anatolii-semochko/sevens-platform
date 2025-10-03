<?php

namespace App\Service\NodeServer;

readonly class NodeServerApiClient
{
    public function __construct(
        private string $nodeServerBaseUrl,
    ) {}

    public function fetchNonce(string $walletAddress): array
    {
        $url = $this->nodeServerBaseUrl . '/auth/nonce?' . http_build_query(['walletAddress' => $walletAddress]);

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => 'Content-Type: application/json',
                'timeout' => 30,
            ],
        ]);

        $response = file_get_contents($url, false, $context);

        if ($response === false) {
            throw new NodeServerApiException('Failed to fetch nonce from Node Server');
        }

        return json_decode($response, true);
    }

    public function validateSignature(
        string $walletAddress,
        string $signature,
        string $nonce
    ): array {
        $data = json_encode([
            'walletAddress' => $walletAddress,
            'signature' => $signature,
            'nonce' => $nonce,
        ]);

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => $data,
                'timeout' => 30,
            ],
        ]);

        $response = file_get_contents($this->nodeServerBaseUrl . '/auth/verify', false, $context);

        if ($response === false) {
            throw new NodeServerApiException('Failed to validate signature with Node Server');
        }

        return json_decode($response, true);
    }

    public function getTokenMetadata(string $tokenPublicKey): array
    {
        $url = $this->nodeServerBaseUrl . '/sevens-tokens?' . http_build_query(['publicKey' => $tokenPublicKey]);

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => 'Content-Type: application/json',
                'timeout' => 30,
            ],
        ]);

        $response = file_get_contents($url, false, $context);

        if ($response === false) {
            throw new NodeServerApiException('Failed to get token metadata from Node Server');
        }

        return json_decode($response, true);
    }
}
