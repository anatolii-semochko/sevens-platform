<?php

namespace App\Entity\PagesContent;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\PageContent\PageContentRepository::class)]
#[ORM\Table(name: 'pages_content')]
#[ORM\UniqueConstraint(name: "unique", columns: ["term", "page_id"])]
class PageContent
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    #[Groups(['page-content:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Page::class, inversedBy: 'contents')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    #[Groups(['page-content:read'])]
    private ?Page $page = null;

    #[ORM\Column(type: 'string', length: 64)]
    #[Groups(['page-content:read'])]
    private string $term;

    #[ORM\OneToMany(targetEntity: PageContentTranslation::class, mappedBy: 'pageContent', cascade: ['persist', 'remove'])]
    #[Groups(['page-content:read'])]
    private Collection $translations;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->translations = new ArrayCollection();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function setId(string $id): void
    {
        $this->id = $id;
    }

    public function setPage(?Page $page): void
    {
        $this->page = $page;
    }

    public function setTerm(string $term): void
    {
        $this->term = $term;
    }

    public function getTranslations(): Collection
    {
        return $this->translations;
    }
}
