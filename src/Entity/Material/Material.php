<?php

namespace App\Entity\Material;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

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
    
    public function getToken(): ?string { return $this->token; }
    public function setToken(string $token): void { $this->token = $token; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): void { $this->title = $title; }
    public function getLogo(): ?string { return $this->logo; }
    public function setLogo(string $logo): void { $this->logo = $logo; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(string $description): void { $this->description = $description; }
}
