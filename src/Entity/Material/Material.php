<?php

namespace App\Entity\Material;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Entity\User;
use App\Entity\Material\MaterialVote;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: \App\Repository\Material\MaterialRepository::class)]
#[ORM\Table(name: 'materials')]
class Material
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 44, unique: true)]
    private string $token;

    #[ORM\Column(type: 'string', length: 64)]
    #[Groups(['material:read'])]
    private string $title;

    #[ORM\Column(type: 'string', length: 64)]
    #[Groups(['material:read'])]
    private string $logo;

    #[ORM\Column(type: 'text')]
    #[Groups(['material:read'])]
    private string $description;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['material:read'])]
    private User $author;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['material:read'])]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['material:read'])]
    private ?string $contractAddress = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['material:read'])]
    private ?array $galleryImages = [];

    #[ORM\Column(type: 'decimal', precision: 20, scale: 8, nullable: true)]
    #[Groups(['material:read'])]
    private ?string $price = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    #[Groups(['material:read'])]
    private int $viewCount = 0;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['material:read'])]
    private bool $hasBlockchainProof = false;

    #[ORM\OneToMany(targetEntity: MaterialVote::class, mappedBy: 'materialToken', cascade: ['persist', 'remove'])]
    private Collection $votes;

    public function __construct()
    {
        $this->votes = new ArrayCollection();
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): void
    {
        $this->token = $token;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function getLogo(): ?string
    {
        return $this->logo;
    }

    public function setLogo(string $logo): void
    {
        $this->logo = $logo;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }

    public function getAuthor(): User
    {
        return $this->author;
    }

    public function setAuthor(User $author): void
    {
        $this->author = $author;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function getContractAddress(): ?string
    {
        return $this->contractAddress;
    }

    public function setContractAddress(?string $contractAddress): void
    {
        $this->contractAddress = $contractAddress;
    }

    public function getGalleryImages(): ?array
    {
        return $this->galleryImages;
    }

    public function setGalleryImages(?array $galleryImages): void
    {
        $this->galleryImages = $galleryImages;
    }

    public function getPrice(): ?string
    {
        return $this->price;
    }

    public function setPrice(?string $price): void
    {
        $this->price = $price;
    }

    public function getViewCount(): int
    {
        return $this->viewCount;
    }

    public function setViewCount(int $viewCount): void
    {
        $this->viewCount = $viewCount;
    }

    public function incrementViewCount(): void
    {
        $this->viewCount++;
    }

    public function hasBlockchainProof(): bool
    {
        return $this->hasBlockchainProof;
    }

    public function setHasBlockchainProof(bool $hasBlockchainProof): void
    {
        $this->hasBlockchainProof = $hasBlockchainProof;
    }

    public function getVotes(): Collection
    {
        return $this->votes;
    }

    public function getLikeCount(): int
    {
        return 0; // Will be implemented via repository service
    }

    public function getDislikeCount(): int
    {
        return 0; // Will be implemented via repository service
    }
}
