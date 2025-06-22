<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\LanguageRepository::class)]
#[ORM\Table(name: 'languages')]
class Language
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['language:read'])]
    private string $id;

    #[ORM\Column(type: 'string', length: 2, unique: true)]
    #[Groups(['language:read'])]
    private string $code;

    #[ORM\Column(type: 'string', length: 16, unique: true)]
    #[Groups(['language:read'])]
    private string $name;

    #[ORM\Column(name: '`order`', type: 'integer', length: 3, unique: true)]
    #[Groups(['language:read'])]
    private int $order;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['language:read'])]
    private bool $active;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['language:read'])]
    private bool $main;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
    }

    public function getId(): ?string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getCode(): string { return $this->code; }
    public function setCode(string $code): void { $this->code = trim($code); }

    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = trim($name); }

    public function getOrder(): int { return $this->order; }
    public function setOrder(int $order): void { $this->order = $order; }
    
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): void { $this->active = $active; }

    public function isMain(): bool { return $this->main; }
    public function setMain(bool $main): void { $this->main = $main; }
}
