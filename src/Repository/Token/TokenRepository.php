<?php

namespace App\Repository\Token;

use App\Entity\Token\SevensToken;
use App\Exception\NotFoundException;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use DateTime;

readonly class TokenRepository
{
    public function __construct(
        private NodeServerApiClient $nodeServerApiClient,
    ) {}

    public function get(string $tokenPublicKey)
    {
        try {
            $tokenData = $this->nodeServerApiClient->getTokenMetadata($tokenPublicKey);

            return new SevensToken(
                $tokenData['tokenPublicKey'],
                new DateTime($tokenData['mintingTime']),
                $tokenData['metadata']['tokenName'],
                $tokenData['metadata']['author'],
                $tokenData['metadata']['description'],
                $tokenData['metadata']['hash'],
                $tokenData['walletPublicKey'],
                $tokenData['sale']['onSale'],
                $tokenData['sale']['priceSevens'],
            );
        } catch (NodeServerApiException $e) {
            throw new NotFoundException('The token was not found on the blockchain.');
        }
    }

    public function find(string $tokenPublicKey): ?SevensToken
    {
        try {
            return $this->get($tokenPublicKey);
        } catch (NotFoundException $e) {
            return null;
        }
    }
}
