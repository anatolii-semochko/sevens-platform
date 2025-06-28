<?php

namespace App\Entity\PagesContent;

use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\PageContent\PageRepository::class)]
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
    }

    public function getId(): ?string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getUrl(): string { return $this->url; }
    public function setUrl(string $url): void { $this->url = trim($url); }
}
