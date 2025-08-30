<?php

namespace App\Entity\Material;

use Doctrine\ORM\Mapping as ORM;
use App\Entity\User;

#[ORM\Entity]
#[ORM\Table(name: 'material_votes')]
#[ORM\UniqueConstraint(
    name: 'unique_user_vote',
    columns: ['material_token', 'user_id'],
    options: ['where' => 'user_id IS NOT NULL']
)]
#[ORM\UniqueConstraint(
    name: 'unique_session_vote', 
    columns: ['material_token', 'session_id'],
    options: ['where' => 'session_id IS NOT NULL']
)]
class MaterialVote
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private int $id;

    #[ORM\Column(type: 'string', length: 44)]
    private string $materialToken;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 128, nullable: true)]
    private ?string $sessionId = null;

    #[ORM\Column(type: 'string', length: 45, nullable: true)]
    private ?string $ipAddress = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $voteType; // 'like' or 'dislike'

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getMaterialToken(): string
    {
        return $this->materialToken;
    }

    public function setMaterialToken(string $materialToken): void
    {
        $this->materialToken = $materialToken;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): void
    {
        $this->user = $user;
    }

    public function getSessionId(): ?string
    {
        return $this->sessionId;
    }

    public function setSessionId(?string $sessionId): void
    {
        $this->sessionId = $sessionId;
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function setIpAddress(?string $ipAddress): void
    {
        $this->ipAddress = $ipAddress;
    }

    public function getVoteType(): string
    {
        return $this->voteType;
    }

    public function setVoteType(string $voteType): void
    {
        $this->voteType = $voteType;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): void
    {
        $this->createdAt = $createdAt;
    }
}