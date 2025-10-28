<?php

namespace App\Service\Blockchain;

use App\Entity\Token\SevensToken;
use App\Entity\Wallet\WalletMessageSignature;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialCommentRepository;
use App\Repository\Material\MaterialRepository;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Symfony\Component\Security\Core\User\UserInterface;

readonly class TokenService
{
    public function __construct(
        private int $allowedPublishingTimeWithoutSignatureMinutes,
        private EntityManagerInterface $em,
        private NodeServerApiClient $nodeServerApiClient,
        private WalletService $walletService,
        private MaterialCommentRepository $materialCommentRepository,
        private MaterialRepository $materialRepository,
    ) {}

    public function getByPublicKey(string $publicKey): SevensToken
    {
        try {
            $tokenData = $this->nodeServerApiClient->getTokenMetadata($publicKey)['data'];

            return new SevensToken(
                $tokenData['tokenPublicKey'],
                new \DateTime($tokenData['mintingTime']),
                $tokenData['metadata']['tokenName'],
                $tokenData['metadata']['author'],
                $tokenData['metadata']['description'],
                $tokenData['metadata']['hash'],
                $tokenData['walletPublicKey'],
                $tokenData['sale']['onSale'],
                (float) $tokenData['sale']['price'],
            );
        } catch (\Throwable $e) {
            throw new NotFoundException('The token was not found on the blockchain.');
        }
    }

    public function checkPossessionByWalletSignature(
        SevensToken $token,
        WalletMessageSignature $walletMessageSignature,
    ): void {
        // Check if wallet possess this token
        if ($token->getWalletPublicKey() !== $walletMessageSignature->getWalletPublicKey()) {
            throw new InvalidArgumentException('This token does not belong to the current wallet.');
        }
        // Check wallet signature
        $this->walletService->verifyWalletSignature($walletMessageSignature);
    }

    /**
     * @throws NodeServerApiException
     */
    public function checkUserPermissionToPublishMaterial(
        SevensToken $token,
        ?WalletMessageSignature $walletMessageSignature,
    ): void {
        // We suppose that token possession is confirmed if token has been minted now
        $ageMinutes = $this->nodeServerApiClient->getTokenAgeMinutes($token->getTokenPublicKey())['data'];
        if (!$walletMessageSignature && $ageMinutes <= $this->allowedPublishingTimeWithoutSignatureMinutes) {
            return;
        }

        if (!$walletMessageSignature?->getSignature()) {
            throw new InvalidArgumentException(
                'To prevent fraud publication you need to publish material from token container ' .
                'and sign the token possession by wallet.'
            );
        }

        $this->checkPossessionByWalletSignature($token, $walletMessageSignature);
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

    /**
     * @throws NodeServerApiException
     */
    public function getSaleTransaction(string $tokenPublicKey, int $price): array
    {
        $material = $this->materialRepository->get($tokenPublicKey);
        $transaction = $this->nodeServerApiClient->getSaleTokenTransaction($material->getToken(), $price)['data'];
        $transactionId = $this->walletService->saveTransaction($transaction);

        return [
            'transactionId' => $transactionId,
            'transaction' => $transaction,
        ];
    }

    /**
     * @throws NodeServerApiException
     */
    public function sale(
        ?UserInterface $user,
        string $tokenPublicKey,
        string $transactionId,
        string $txSignature,
    ): void {
        $material = $this->materialRepository->get($tokenPublicKey);
        if (!$material->isActive()) {
            throw new InvalidArgumentException('Material is not active.');
        }
        $this->walletService->matchTransactionSignature($transactionId, $txSignature);
        $result = $this->nodeServerApiClient->sendSignedTransaction($txSignature);

        if ($result['success'] === true) {
            $tokenData = $this->nodeServerApiClient->getTokenMetadata($tokenPublicKey)['data'];
            $material->setUser($user);
            $material->setPrice($tokenData['sale']['priceSevens']);
            $this->em->persist($material);
            $this->em->flush();
        }
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBuyTransaction(string $tokenPublicKey, string $buyerPublicKey): array
    {
        $material = $this->materialRepository->get($tokenPublicKey);
        $transaction = $this->nodeServerApiClient->getBuyTokenTransaction(
            $material->getToken(),
            $buyerPublicKey,
        )['data'];
        $transactionId = $this->walletService->saveTransaction($transaction);

        return [
            'transactionId' => $transactionId,
            'transaction' => $transaction,
        ];
    }

    /**
     * @throws NodeServerApiException
     */
    public function buy(
        ?UserInterface $user,
        string $tokenPublicKey,
        string $transactionId,
        string $txSignature,
        bool $deactivate,
    ): void {
        $material = $this->materialRepository->get($tokenPublicKey);
        if (!$material->isActive()) {
            throw new InvalidArgumentException('Material is not active.');
        }
        $this->walletService->matchTransactionSignature($transactionId, $txSignature);
        $result = $this->nodeServerApiClient->sendSignedTransaction($txSignature);

        if ($result['success'] === true) {
            $material->setUser($user);
            $material->setPrice(0);
            $material->setActive(!$deactivate);
            $this->em->persist($material);
            $this->em->flush();
        }
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBurnTransaction(string $tokenPublicKey): array
    {
        $transaction = $this->nodeServerApiClient->getBurnTokenTransaction($tokenPublicKey)['data'];
        $transactionId = $this->walletService->saveTransaction($transaction);

        return [
            'transactionId' => $transactionId,
            'transaction' => $transaction,
        ];
    }

    /**
     * @throws NodeServerApiException
     */
    public function burn(string $tokenPublicKey, string $transactionId, string $txSignature): void {
        $this->walletService->matchTransactionSignature($transactionId, $txSignature);
        $result = $this->nodeServerApiClient->sendSignedTransaction($txSignature);
        if ($result['success'] === true) {
            $this->materialCommentRepository->deleteByMaterialToken($tokenPublicKey);
            $this->materialRepository->deleteByToken($tokenPublicKey);
        }
    }
}
