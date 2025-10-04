<?php

namespace App\Service\Blockchain;

use App\Entity\Token\SevensToken;
use App\Entity\User;
use App\Exception\NotFoundException;
use App\Service\NodeServer\NodeServerApiClient;

readonly class TokenService
{
    public function __construct(
        private NodeServerApiClient $nodeServerApiClient,
    ) {}

    public function getByPublicKey(string $publicKey): SevensToken
    {
        try {
            $tokenData = $this->nodeServerApiClient->getTokenMetadata($publicKey)['data'];

            return new SevensToken(
                $tokenData['tokenPublicKey'],
                $tokenData['walletPublicKey'],
                new \DateTime($tokenData['mintingTime']),
                $tokenData['metadata']['tokenName'],
                $tokenData['metadata']['author'],
                $tokenData['metadata']['description'],
                $tokenData['metadata']['hash'],
                $tokenData['sale']['onSale'],
                (float) $tokenData['sale']['price'],
            );
        } catch (\Throwable $e) {
            throw new NotFoundException('The token was not found on the blockchain.');
        }
    }

    public function checkUserAuthority(User $user, string $tokenPublicKey, array $signature)
    {

    }
}
