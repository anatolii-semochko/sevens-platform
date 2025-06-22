<?php

namespace App\Entity\PagesContent;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\PagesContent\PageRepository::class)]
#[ORM\Table(name: 'pages')]
class Page
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    #[Groups(['page:read'])]
    private string $id;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    #[Groups(['page:read'])]
    private string $url;

    #[ORM\OneToMany(mappedBy: 'page', targetEntity: PageSeo::class, cascade: ['persist', 'remove'])]
    #[Groups(['page:read'])]
    private Collection $seo;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
        $this->seo = new ArrayCollection();
    }

    public function getId(): ?string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getUrl(): string { return $this->url; }
    public function setUrl(string $url): void { $this->url = trim($url); }

    public function getSeo(): Collection { return $this->seo; }

    public function addSeo(PageSeo $seo): self
    {
        if (!$this->seo->contains($seo)) {
            $this->seo[] = $seo;
            $seo->setPage($this);
        }
        return $this;
    }

    public function removeSeo(PageSeo $seo): self
    {
        if ($this->seo->removeElement($seo) && $seo->getPage() === $this) {
            $seo->setPage(null);
        }
        return $this;
    }

    public function getContents(): Collection { return $this->contents; }

    public function addContent(PageContent $content): self
    {
        if (!$this->contents->contains($content)) {
            $this->contents[] = $content;
            $content->setPage($this);
        }
        return $this;
    }

    public function removeContent(PageContent $content): self
    {
        if ($this->contents->removeElement($content) && $content->getPage() === $this) {
            $content->setPage(null);
        }
        return $this;
    }
}
