<?php

namespace App\Repository\TokenManage;

use App\Entity\TokenManage\ManageTransaction;
use App\Entity\TokenManage\ManageTransactionTypeEnum;
use App\Entity\TokenManage\TokenManageTariffsPda;
use App\Entity\User;
use App\Service\NodeServer\NodeServerApiClient;
use App\Service\NodeServer\NodeServerApiException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ManageTransaction>
 */
class ManageTransactionRepository extends ServiceEntityRepository
{
    private mixed $nodeServerApiClient;

    public function __construct(
        ManagerRegistry $registry,
        NodeServerApiClient $nodeServerApiClient,
    ) {
        parent::__construct($registry, ManageTransaction::class);
        $this->nodeServerApiClient = $nodeServerApiClient;
    }

    public function save(ManageTransaction $manageTransaction): void
    {
        $this->getEntityManager()->persist($manageTransaction);
        $this->getEntityManager()->flush();
    }

    /**
     * @throws NodeServerApiException
     */
    public function createEntry(
        ManageTransactionTypeEnum $type,
        TokenManageTariffsPda $tokenManageTariffsPda,
        float $income,
        ?User $user,
        ?string $token,
    ): ManageTransaction {
        $targetWalletBalance = $this->nodeServerApiClient->getWalletBalance($tokenManageTariffsPda->getTargetWallet());

        $manageTransaction = new ManageTransaction();
        $manageTransaction->setToken($token);
        $manageTransaction->setType($type);
        $manageTransaction->setTargetWallet($tokenManageTariffsPda->getTargetWallet());
        $manageTransaction->setIncome($income);
        $manageTransaction->setTargetWalletBalance($targetWalletBalance);
        $manageTransaction->setUser($user);
        $this->save($manageTransaction);

        return $manageTransaction;
    }
}
