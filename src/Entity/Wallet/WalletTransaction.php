<?php

namespace App\Entity\Wallet;

use DateTime;
use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\Wallet\WalletTransactionRepository::class)]
#[ORM\Table(name: 'wallet_transaction')]
class WalletTransaction
{
    #[ORM\Id]
    #[ORM\Column(type: "string", length: 36)]
    #[Groups(['wallet-transaction:read'])]
    private string $id;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['wallet-transaction:read'])]
    private DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['wallet-transaction:read'])]
    private ?DateTimeInterface $usedAt = null;

    #[ORM\Column(type: 'text')]
    #[Groups(['wallet-transaction:read'])]
    private string $transaction;

    #[ORM\Column(type: 'string', nullable: true)]
    #[Groups(['wallet-transaction:read'])]
    private ?string $error = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new DateTime();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUsedAt(): DateTimeInterface
    {
        return $this->usedAt;
    }

    public function setUsedAt(DateTimeInterface $usedAt): void
    {
        $this->usedAt = $usedAt;
    }

    public function getTransaction(): string
    {
        return $this->transaction;
    }

    public function setTransaction(string $transaction): void
    {
        $this->transaction = $transaction;
    }

    public function getError(): string
    {
        return $this->error;
    }

    public function setError(string $error): void
    {
        $this->error = $error;
    }
}
