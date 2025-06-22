<?php

namespace App\Entity\Help;

use App\Repository\Help\HelpRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: HelpRepository::class)]
#[ORM\Table(name: 'help')]
#[ORM\UniqueConstraint(name: 'unique_name', columns: ['parent_id', 'name'])]
#[ORM\UniqueConstraint(name: 'unique_url', columns: ['url'])]
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

    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['help:read'])]
    private string $name = '';

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
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

    #[ORM\OneToMany(mappedBy: 'help', targetEntity: HelpContent::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['help:read'])]
    private Collection $contents;

    public function __construct()
    {
        $this->contents = new ArrayCollection();
    }

    public function getId(): string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getParentId(): ?string { return $this->parentId; }
    public function setParentId(?string $parentId): void { $this->parentId = $parentId; }

    public function getChildren(): Collection { return $this->children; }

    public function getOrder(): int { return $this->order; }
    public function setOrder(int $order): void { $this->order = $order; }

    public function getLevel(): int { return $this->level; }
    public function setLevel(int $level): void { $this->level = $level; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = $name; }

    public function getUrl(): ?string { return $this->url; }
    public function setUrl(?string $url): void { $this->url = $url; }

    public function getParents(): ?string { return $this->parents; }
    public function setParents(?string $parents): void { $this->parents = $parents; }

    public function getChildrenData(): ?string { return $this->childrenData; }
    public function setChildrenData(?string $childrenData): void { $this->childrenData = $childrenData; }

    public function getChildrenInside(): ?string { return $this->childrenInside; }
    public function setChildrenInside(?string $childrenInside): void { $this->childrenInside = $childrenInside; }

    public function getPath(): ?string { return $this->path; }
    public function setPath(?string $path): void { $this->path = $path; }

    public function getContents(): Collection { return $this->contents; }
    public function addContent(HelpContent $content): void {
        if (!$this->contents->contains($content)) {
            $this->contents[] = $content;
            $content->setHelp($this);
        }
    }
    public function removeContent(HelpContent $content): void {
        if ($this->contents->removeElement($content)) {
            if ($content->getHelp() === $this) {
                $content->setHelp(null);
            }
        }
    }
}
