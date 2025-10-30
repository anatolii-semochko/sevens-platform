<?php

namespace App\Entity\TokenManage;

use App\Entity\User;
use App\Repository\TokenManage\ManageTransactionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ManageTransactionRepository::class)]
#[ORM\Table(name: 'manage_transactions')]
class ManageTransaction
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['manage-transaction:read'])]
    private string $id;

    #[ORM\Column(
        type: 'string',
        enumType: ManageTransactionTypeEnum::class,
    )]
    #[Groups(['manage-transaction:read'])]
    private ManageTransactionTypeEnum $type;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['manage-transaction:read'])]
    private \DateTimeInterface $createdAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['manage-transaction:read'])]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 44, nullable: true)]
    #[Groups(['manage-transaction:read'])]
    private ?string $token = null;

    #[ORM\Column(type: 'decimal', precision: 20, scale: 9)]
    #[Groups(['manage-transaction:read'])]
    private float $income;

    #[ORM\Column(type: 'string', length: 44)]
    #[Groups(['manage-transaction:read'])]
    private string $targetWallet;

    #[ORM\Column(type: 'decimal', precision: 20, scale: 9)]
    #[Groups(['manage-transaction:read'])]
    private float $targetWalletBalance;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getType(): ManageTransactionTypeEnum
    {
        return $this->type;
    }

    public function setType(ManageTransactionTypeEnum $type): void
    {
        $this->type = $type;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): void
    {
        $this->user = $user;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(?string $token): void
    {
        $this->token = $token;
    }

    public function getIncome(): float
    {
        return $this->income;
    }

    public function setIncome(float $income): void
    {
        $this->income = $income;
    }

    public function getTargetWallet(): string
    {
        return $this->targetWallet;
    }

    public function setTargetWallet(string $targetWallet): void
    {
        $this->targetWallet = $targetWallet;
    }

    public function getTargetWalletBalance(): float
    {
        return $this->targetWalletBalance;
    }

    public function setTargetWalletBalance(float $targetWalletBalance): void
    {
        $this->targetWalletBalance = $targetWalletBalance;
    }
}
