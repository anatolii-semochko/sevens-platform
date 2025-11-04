<?php

namespace App\Service\Blockchain;

use App\Entity\Material\Material;
use App\Entity\Token\SevensToken;
use App\Entity\TokenManage\ManageTransactionTypeEnum;
use App\Entity\Wallet\WalletMessageSignature;
use App\Entity\Wallet\WalletTransactionTypeEnum;
use App\Exception\NotFoundException;
use App\Repository\Material\MaterialCommentRepository;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialSaleHistoryRepository;
use App\Repository\Token\TokenRepository;
use App\Repository\TokenManage\ManageTransactionRepository;
use App\Repository\TokenManage\TokenManagePdaRepository;
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
        private TokenRepository $tokenRepository,
        private TokenManagePdaRepository $tokenManagePdaRepository,
        private ManageTransactionRepository $manageTransactionRepository,
        private MaterialCommentRepository $materialCommentRepository,
        private MaterialRepository $materialRepository,
        private MaterialSaleHistoryRepository $materialSaleHistoryRepository,
    ) {}

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
        $ageMinutes = $this->nodeServerApiClient->getTokenAgeMinutes($token->getTokenPublicKey());
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
    public function getMintTransaction(string $mintPublicKey, array $tokenData): array
    {
        $this->checkManagementTariffsStatus();
        $result = $this->nodeServerApiClient->getMintTokenTransaction($mintPublicKey, $tokenData);
        $transactionId = $this->walletService->saveTransaction(
            WalletTransactionTypeEnum::TOKEN_MINT,
            $result['transaction'],
        );

        return [
            'transactionId' => $transactionId,
            'transaction' => $result['transaction'],
            'mint' => $result['mint'],
        ];
    }

    /**
     * @throws NodeServerApiException
     */
    public function mint(
        ?UserInterface $user,
        string $tokenPublicKey,
        string $transactionId,
        string $txSignature,
    ): void {
        $this->walletService->matchTransactionSignature($transactionId, $txSignature);
        $this->nodeServerApiClient->sendSignedTransaction($txSignature);

        $tokenManageTariffsPda = $this->tokenManagePdaRepository->getTariffsPda();
        $this->manageTransactionRepository->createEntry(
            ManageTransactionTypeEnum::TOKEN_MINT,
            $tokenManageTariffsPda,
            $tokenManageTariffsPda->getMint(),
            $user,
            $tokenPublicKey,
        );
    }

    /**
     * @throws NodeServerApiException
     */
    public function getSaleTransaction(string $tokenPublicKey, int $price): array
    {
        $this->checkManagementTariffsStatus();
        $material = $this->materialRepository->get($tokenPublicKey);
        $transaction = $this->nodeServerApiClient->getSaleTokenTransaction($material->getToken(), $price);
        $transactionId = $this->walletService->saveTransaction(WalletTransactionTypeEnum::TOKEN_SALE, $transaction);

        return [
            'transactionId' => $transactionId,
            'transaction' => $transaction,
        ];
    }

    /**
     * @throws NodeServerApiException
     */
    public function sale(
        Material $material,
        string $transactionId,
        string $txSignature,
    ): void {
        $this->walletService->matchTransactionSignature($transactionId, $txSignature);
        $this->nodeServerApiClient->sendSignedTransaction($txSignature);
        try {
            $sevensToken = $this->tokenRepository->get($material->getToken());
            $tokenManagePda = $this->tokenManagePdaRepository->get($material->getToken());
            $tokenManageTariffsPda = $this->tokenManagePdaRepository->getTariffsPda();

            $this->manageTransactionRepository->createEntry(
                ManageTransactionTypeEnum::TOKEN_SALE,
                $tokenManageTariffsPda,
                $tokenManageTariffsPda->getSetSale(),
                $material->getUser(),
                $sevensToken->getTokenPublicKey(),
            );

            $material->setPrice($tokenManagePda->getRetailPrice());
            $this->em->persist($material);
            $this->em->flush();

            $this->materialSaleHistoryRepository->createEntry(
                $material->getToken(),
                $sevensToken->getWalletPublicKey(),
                $tokenManagePda->getRetailPrice(),
            );
        } catch (\Throwable $e) {
            $material->setPrice(null);
            $this->em->persist($material);
            $this->em->flush();
            throw new InvalidArgumentException("List token to sale error: {$e->getMessage()}");
        }
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBuyTransaction(string $tokenPublicKey, string $buyerPublicKey): array
    {
        $this->checkManagementTariffsStatus();
        $material = $this->materialRepository->get($tokenPublicKey);
        $transaction = $this->nodeServerApiClient->getBuyTokenTransaction($material->getToken(), $buyerPublicKey);
        $transactionId = $this->walletService->saveTransaction(WalletTransactionTypeEnum::TOKEN_BUY, $transaction);

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
        $tokenManagePda = $this->tokenManagePdaRepository->get($material->getToken());
        $this->nodeServerApiClient->sendSignedTransaction($txSignature);

        $tokenManageTariffsPda = $this->tokenManagePdaRepository->getTariffsPda();
        $this->manageTransactionRepository->createEntry(
            ManageTransactionTypeEnum::TOKEN_BUY,
            $tokenManageTariffsPda,
            $tokenManagePda->getRetailPrice() - $tokenManagePda->getPrice(),
            $material->getUser(),
            $material->getToken(),
        );

        $material->setUser($user);
        $material->setPrice(0);
        $material->setActive(!$deactivate);
        $this->em->persist($material);
        $this->em->flush();

        $sevensToken = $this->tokenRepository->get($material->getToken());
        $this->materialSaleHistoryRepository->createEntry($material->getToken(), $sevensToken->getWalletPublicKey(), 0);
    }

    /**
     * @throws NodeServerApiException
     */
    public function getBurnTransaction(string $tokenPublicKey): array
    {
        $this->checkManagementTariffsStatus();
        $transaction = $this->nodeServerApiClient->getBurnTokenTransaction($tokenPublicKey);
        $transactionId = $this->walletService->saveTransaction(WalletTransactionTypeEnum::TOKEN_BURN, $transaction);

        return [
            'transactionId' => $transactionId,
            'transaction' => $transaction,
        ];
    }

    /**
     * @throws NodeServerApiException
     */
    public function burn(?UserInterface $user, string $tokenPublicKey, string $transactionId, string $txSignature): void {
        $this->walletService->matchTransactionSignature($transactionId, $txSignature);
        $this->nodeServerApiClient->sendSignedTransaction($txSignature);

        $tokenManageTariffsPda = $this->tokenManagePdaRepository->getTariffsPda();
        $this->manageTransactionRepository->createEntry(
            ManageTransactionTypeEnum::TOKEN_BURN,
            $tokenManageTariffsPda,
            $tokenManageTariffsPda->getBurn(),
            $user,
            $tokenPublicKey,
        );

        $this->materialCommentRepository->deleteByMaterialToken($tokenPublicKey);
        $this->materialRepository->deleteByToken($tokenPublicKey);
    }

    private function checkManagementTariffsStatus(): void
    {
        $tokenManageTariffsPda = $this->tokenManagePdaRepository->getTariffsPda();
        if ($tokenManageTariffsPda->isPaused()) {
            throw new NotFoundException('This operation is currently unavailable. Please try again later.');
        }
    }
}
