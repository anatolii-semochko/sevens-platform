<?php

namespace App\Entity;

use App\Repository\TestRepository;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TestRepository::class)]
#[ORM\Table(name: 'test')]
class Test
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['test:read'])]
    private int $id;

    #[ORM\Column(type: 'string', length: 32, unique: true)]
    #[Groups(['test:read'])]
    private string $name;

    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }
}
