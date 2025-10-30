<?php

namespace App\Entity\Material;

use App\Entity\Token\SevensToken;
use App\Entity\Token\SevensTokenContainer;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\UserInterface;
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
    #[Groups(['material:read'])]
    private string $token;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['material:read'])]
    private bool $active = true;

    #[ORM\Column(type: 'string', length: 64)]
    #[Groups(['material:read'])]
    private string $title;

    #[ORM\Column(type: 'string', length: 64)]
    #[Groups(['material:read'])]
    private string $logo;

    #[ORM\Column(type: 'text')]
    #[Groups(['material:read'])]
    private string $description;

    #[ORM\Column(type: 'json')]
    #[Groups(['material:read'])]
    private array $tokenData = [];

    #[ORM\Column(type: 'json')]
    #[Groups(['material:read'])]
    private array $tokenContainer = [];

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['material:read'])]
    private ?User $user = null;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['material:read'])]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(type: 'datetime')]
    #[Groups(['material:read'])]
    private \DateTimeInterface $updatedAt;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['material:read'])]
    private ?\DateTimeInterface $downloadedAt = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['material:read'])]
    private ?string $contractAddress = null;

    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['material:read'])]
    private ?array $galleryImages = [];

    #[ORM\Column(type: 'decimal', precision: 20, scale: 9, nullable: true)]
    #[Groups(['material:read'])]
    private ?float $price = null;

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
        $this->active = false;
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

    /**
     * @throws \DateMalformedStringException
     */
    public function getTokenData(): SevensToken
    {
        return new SevensToken(
            $this->tokenData['tokenPublicKey'],
            new \DateTime($this->tokenData['mintingTimestamp']),
            $this->tokenData['name'],
            $this->tokenData['author'],
            $this->tokenData['description'],
            $this->tokenData['hash'],
        );
    }

    public function setTokenData(SevensToken $sevensToken): void
    {
        $this->tokenData = [
            'tokenPublicKey' => $sevensToken->getTokenPublicKey(),
            'mintingTimestamp' => $sevensToken->getMintingTime()->format('Y-m-d H:i:s'),
            'name' => $sevensToken->getName(),
            'author' => $sevensToken->getAuthor(),
            'description' => $sevensToken->getDescription(),
            'hash' => $sevensToken->getHash(),
        ];
    }

    public function getTokenContainer(): SevensTokenContainer
    {
        return new SevensTokenContainer(
            $this->tokenContainer['name'],
            $this->tokenContainer['size'],
            $this->tokenContainer['hash'],
        );
    }

    public function setTokenContainer(SevensTokenContainer $sevensTokenContainer): void
    {
        $this->tokenContainer= [
            'name' => $sevensTokenContainer->getName(),
            'size' => $sevensTokenContainer->getSize(),
            'hash' => $sevensTokenContainer->getHash(),
        ];
    }

    public function getUser(): ?UserInterface
    {
        return $this->user;
    }

    public function setUser(?UserInterface $user): void
    {
        $this->user = $user;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): void
    {
        $this->createdAt = $createdAt;
    }

    public function getUpdatedAt(): \DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function getDownloadedAt(): ?\DateTimeInterface
    {
        return $this->downloadedAt;
    }

    public function setDownloadedAt(?\DateTimeInterface $downloadedAt): void
    {
        $this->downloadedAt = $downloadedAt;
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

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(?float $price): void
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

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): void
    {
        $this->active = $active;
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
