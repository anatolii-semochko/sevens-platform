<?php

declare(strict_types=1);

namespace App\Entity\TokenManage;

use App\Entity\Admin\User;
use App\Repository\TokenManage\ManageTariffHistoryRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ManageTariffHistoryRepository::class)]
#[ORM\Table(name: 'manage_tariff_history')]
class ManageTariffHistory
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['tariff-history:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['tariff-history:read'])]
    private User $adminUser;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['tariff-history:read'])]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'string', length: 44)]
    #[Groups(['tariff-history:read'])]
    private string $targetWallet;

    #[ORM\Column(type: 'float', options: ['unsigned' => true])]
    #[Groups(['tariff-history:read'])]
    private float $mint;

    #[ORM\Column(type: 'float', options: ['unsigned' => true])]
    #[Groups(['tariff-history:read'])]
    private float $setSale;

    #[ORM\Column(type: 'smallint', options: ['unsigned' => true])]
    #[Groups(['tariff-history:read'])]
    private int $buy;

    #[ORM\Column(type: 'float', options: ['unsigned' => true])]
    #[Groups(['tariff-history:read'])]
    private float $burn;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['tariff-history:read'])]
    private bool $paused;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getAdminUser(): User
    {
        return $this->adminUser;
    }

    public function setAdminUser(UserInterface $adminUser): void
    {
        $this->adminUser = $adminUser;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getTargetWallet(): string
    {
        return $this->targetWallet;
    }

    public function setTargetWallet(string $targetWallet): void
    {
        $this->targetWallet = $targetWallet;
    }

    public function getMint(): float
    {
        return $this->mint;
    }

    public function setMint(float $mint): void
    {
        $this->mint = $mint;
    }

    public function getSetSale(): float
    {
        return $this->setSale;
    }

    public function setSetSale(float $setSale): void
    {
        $this->setSale = $setSale;
    }

    public function getBuy(): int
    {
        return $this->buy;
    }

    public function setBuy(int $buy): void
    {
        $this->buy = $buy;
    }

    public function getBurn(): float
    {
        return $this->burn;
    }

    public function setBurn(float $burn): self
    {
        $this->burn = $burn;
        return $this;
    }

    public function isPaused(): bool
    {
        return $this->paused;
    }

    public function setPaused(bool $paused): self
    {
        $this->paused = $paused;
        return $this;
    }
}
