<?php

namespace App\Entity\Material;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\Material\MaterialSaleHistoryRepository::class)]
#[ORM\Table(name: 'material_sale_history')]
class MaterialSaleHistory
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['material-sale-history:read'])]
    private string $id;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 44)]
    #[Groups(['material-sale-history:read'])]
    private string $token;

    #[ORM\Column(type: 'string', length: 44)]
    #[Groups(['material-sale-history:read'])]
    private string $wallet;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['material-sale-history:read'])]
    private \DateTimeInterface $date;

    #[ORM\Column(type: 'decimal', precision: 20, scale: 9, nullable: true)]
    #[Groups(['material-sale-history:read'])]
    private ?string $price = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->date = new \DateTime();
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): void
    {
        $this->token = $token;
    }

    public function getWallet(): ?string
    {
        return $this->wallet;
    }

    public function setWallet(string $walletPublicKey): void
    {
        $this->wallet = $walletPublicKey;
    }

    public function getDate(): \DateTimeInterface
    {
        return $this->date;
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(?float $price): void
    {
        $this->price = $price;
    }
}
