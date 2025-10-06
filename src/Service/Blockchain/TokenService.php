<?php

namespace App\Service\Blockchain;

use App\Entity\Token\SevensToken;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialRepository;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;

readonly class TokenService
{
    private const int ALLOWED_TOKEN_MAX_AGE_WITHOUT_SIGNATURE_MINUTES = 15;

    public function __construct(
        private EntityManagerInterface $em,
        private NodeServerApiClient $nodeServerApiClient,
        private WalletService $walletService,
        private MaterialRepository $materialRepository,
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

    public function checkPossessionByWalletSignature(
        SevensToken $token,
        ?string $walletPublicKey,
        ?string $nonce,
        ?string $signature,
    ): void {
        if (!$signature) {
            throw new InvalidArgumentException('No wallet signature.');
        }

        if (!$nonce) {
            throw new InvalidArgumentException('No nonce.');
        }

        if (!$walletPublicKey) {
            throw new InvalidArgumentException('No wallet public key.');
        }

        // Check if wallet possess this token
        if ($token->getWalletPublicKey() !== $walletPublicKey) {
            throw new InvalidArgumentException('This token does not belong to the current wallet.');
        }

        // Check wallet signature
        $this->walletService->verifyWalletSignature($token->getWalletPublicKey(), $signature, $nonce);
    }

    /**
     * @throws NodeServerApiException
     */
    public function checkUserPermissionToPublishMaterial(SevensToken $token, array $walletSignature): void
    {
        // We suppose that token possession is confirmed if token has been minted now
        $ageMinutes = $this->nodeServerApiClient->getTokenAgeMinutes($token->getTokenPublicKey())['data'];
        if (
            empty($walletSignature['signature']) && $ageMinutes <= self::ALLOWED_TOKEN_MAX_AGE_WITHOUT_SIGNATURE_MINUTES
        ) {
            return;
        }

        if (empty($walletSignature['signature'])) {
            throw new InvalidArgumentException(
                'To prevent fraud publication you need to publish material from token container ' .
                'and sign the token possession by wallet.'
            );
        }

        $this->checkPossessionByWalletSignature(
            $token,
            $walletSignature['walletPublicKey'] ?: null,
            $walletSignature['nonce'] ?: null,
            $walletSignature['signature'],
        );
    }

    /**
     * @throws NodeServerApiException
     */
    public function refreshSaleStatus(string $tokenPublicKey): array
    {
        $tokenData = $this->nodeServerApiClient->getTokenMetadata($tokenPublicKey)['data'];
        $material = $this->materialRepository->findOneBy(['token' => $tokenPublicKey]);
        if ($material) {
            $priceToken = $tokenData['sale']['priceSevens'];
            $priceMaterial = $material->getPrice();
            if ($priceToken !== $priceMaterial) {
                $material->setPrice($priceToken);
                $this->em->persist($material);
                $this->em->flush();
            }
        }

        return $tokenData;
    }
}
