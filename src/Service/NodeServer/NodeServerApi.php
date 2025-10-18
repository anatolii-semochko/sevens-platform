<?php

namespace App\Service\NodeServer;

use CurlHandle;

readonly class NodeServerApi
{
    public function __construct(
        private string $nodeServerBaseUrl,
    ) {}

    /**
     * @throws NodeServerApiException
     */
    public function get(string $endpoint, ?array $data): array
    {
        $handle = curl_init();

        curl_setopt_array($handle, [
            CURLOPT_URL => $this->nodeServerBaseUrl . $endpoint . ($data ? '?' . http_build_query($data) : ''),
            CURLOPT_HTTPGET => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FAILONERROR => false,
        ]);

        return $this->getCurlResponse($handle);
    }

    /**
     * @throws NodeServerApiException
     */
    public function post(string $endpoint, array $data): array
    {
        $handle = curl_init();

        curl_setopt_array($handle, [
            CURLOPT_URL => $this->nodeServerBaseUrl . $endpoint,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FAILONERROR => false,
        ]);

        return $this->getCurlResponse($handle);
    }

    /**
     * @throws NodeServerApiException
     */
    private function getCurlResponse(CurlHandle $handle): array
    {
        $response = curl_exec($handle);
        $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $curlError = curl_error($handle);
        curl_close($handle);

        if ($response === false || $curlError) {
            throw new NodeServerApiException('CURL error: ' . $curlError);
        }

        if ($httpCode >= 400) {
            $errorData = json_decode($response, true);
            $errorMessage = $errorData['error'] ?? 'HTTP ' . $httpCode . ' error';
            throw new NodeServerApiException($errorMessage);
        }

        return json_decode($response, true);
    }
}
