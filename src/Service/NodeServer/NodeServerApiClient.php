<?php

namespace App\Service\NodeServer;

readonly class NodeServerApiClient
{
    public function __construct(
        private string $nodeServerBaseUrl,
    ) {}

    /**
     * @throws NodeServerApiException
     */
    public function fetchNonce(string $walletAddress): array
    {
        $response = file_get_contents(
            $this->nodeServerBaseUrl . '/auth/nonce?' . http_build_query(['walletAddress' => $walletAddress]),
            false,
            $this->getContext('GET'),
        );

        $this->checkResponse($response);

        return json_decode($response, true);
    }

    /**
     * @throws NodeServerApiException
     */
    public function validateSignature(
        string $walletAddress,
        string $signature,
        string $nonce
    ): array {
        $response = file_get_contents(
            $this->nodeServerBaseUrl . '/auth/verify',
            false,
            $this->getContext('POST', json_encode([
                'walletAddress' => $walletAddress,
                'signature' => $signature,
                'nonce' => $nonce,
            ])),
        );

        $this->checkResponse($response);

        return json_decode($response, true);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getTokenMetadata(string $tokenPublicKey): array
    {
        $response = file_get_contents(
            $this->nodeServerBaseUrl . '/sevens-tokens?' . http_build_query(['publicKey' => $tokenPublicKey]),
            false,
            $this->getContext('GET'),
        );

        $this->checkResponse($response);

        return json_decode($response, true);
    }

    /**
     * @param string $tokenPublicKey
     * @return array
     * @throws NodeServerApiException
     */
    public function getTokenAgeMinutes(string $tokenPublicKey): array
    {
        $response = file_get_contents(
            $this->nodeServerBaseUrl . '/sevens-tokens/age-minutes?' . http_build_query(['publicKey' => $tokenPublicKey]),
            false,
            $this->getContext('GET'),
        );

        $this->checkResponse($response);

        return json_decode($response, true);
    }

    private function getContext(string $method, ?string $content = null)
    {
        $http = [
            'method' => $method,
            'header' => 'Content-Type: application/json',
            'timeout' => 30,
        ];

        if ($content) {
            $this['content'] = $content;
        }

        return stream_context_create([
            'http' => $http,
        ]);
    }

    /**
     * @throws NodeServerApiException
     */
    private function checkResponse(false|string $response): void
    {
        if ($response === false) {
            throw new NodeServerApiException('Failed to validate signature with Node Server');
        }
    }
}
