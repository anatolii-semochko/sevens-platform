<?php

namespace App\Repository\TokenManage;

use App\Entity\TokenManage\TokenManagePda;
use App\Entity\TokenManage\TokenManageTariffsPda;
use App\Exception\NotFoundException;
use App\Repository\Token\TokenRepository;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use InvalidArgumentException;

readonly class TokenManagePdaRepository
{
    public function __construct(
        private NodeServerApiClient $nodeServerApiClient,
        private TokenRepository $tokenRepository,
    ) {}

    public function get(string $tokenPublicKey): TokenManagePda
    {
        try {
            $manageTokenData = $this->nodeServerApiClient->getManageTokenData($tokenPublicKey);
            return new TokenManagePda($manageTokenData);
        } catch (NodeServerApiException $e) {
            throw new NotFoundException('Token manage data not found.', previous: $e);
        }
    }

    public function getValidated(string $tokenPublicKey): TokenManagePda
    {
        $token = $this->tokenRepository->get($tokenPublicKey);
        $tokenManagePda = $this->get($tokenPublicKey);
        if ($token->isOnSale() !== $tokenManagePda->isOnSale() || $token->getPrice() !== $tokenManagePda->getPrice()) {
            throw new InvalidArgumentException('Token data price is wrong.');
        }

        return $tokenManagePda;
    }

    public function find(string $tokenPublicKey): ?TokenManagePda
    {
        try {
            return $this->get($tokenPublicKey);
        } catch (NotFoundException $e) {
            return null;
        }
    }

    public function getTariffsPda(): TokenManageTariffsPda
    {
        try {
            $manageTokenTariffsData = $this->nodeServerApiClient->getManageTokenTariffsData();
            if (!$manageTokenTariffsData) {
                throw new NotFoundException('This operation is currently unavailable. Please try again later.');
            }

            return new TokenManageTariffsPda($manageTokenTariffsData);
        } catch (NodeServerApiException $e) {
            throw new NotFoundException('Token manage tariffs data not found.', previous: $e);
        }
    }
}
