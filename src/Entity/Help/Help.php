<?php

namespace App\Entity\Help;

use App\Repository\Help\HelpRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HelpRepository::class)]
#[ORM\Table(name: 'help')]
class Help
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['help:read'])]
    private string $id;

    #[ORM\Column(name: "parent_id", type: "string", length: 36, nullable: true)]
    #[Groups(['help:read'])]
    private ?string $parentId = null;

    #[ORM\Column(name: "`order`", type: "integer", options: ["unsigned" => true])]
    #[Groups(['help:read'])]
    private int $order = 0;

    #[ORM\Column(type: "smallint", options: ["unsigned" => true])]
    #[Groups(['help:read'])]
    private int $level = 0;

    #[ORM\Column(type: 'string', length: 36, unique: true)]
    #[Groups(['help:read'])]
    private string $name = '';

    #[ORM\Column(type: 'string', length: 255, unique: true, nullable: true)]
    #[Groups(['help:read'])]
    private ?string $url = null;

    #[ORM\Column(type: 'string', length: 1024, nullable: true)]
    #[Groups(['help:read'])]
    private ?string $parents = null;

    #[ORM\Column(name: 'children', type: 'text', nullable: true)]
    #[Groups(['help:read'])]
    private ?string $childrenData = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['help:read'])]
    private ?string $childrenInside = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['help:read'])]
    private ?string $path = null;

    #[ORM\OneToMany(targetEntity: HelpContent::class, mappedBy: 'help')]
    #[Groups(['help:read'])]
    private Collection $contents;

    public function __construct()
    {
        $this->contents = new ArrayCollection();
    }

    public function getId(): string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getParentId(): ?string { return $this->parentId; }

    public function getChildren(): Collection { return $this->children; }

    public function getOrder(): int { return $this->order; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = $name; }

    public function getUrl(): ?string { return $this->url; }

    public function getParents(): ?string { return $this->parents; }

    public function getChildrenData(): ?string { return $this->childrenData; }

    public function getPath(): ?string { return $this->path; }
    public function setPath(?string $path): void { $this->path = $path; }

    public function getContents(): Collection { return $this->contents; }

    public function setContents(Collection $contents): void
    {
        $this->contents = $contents;
    }
}
