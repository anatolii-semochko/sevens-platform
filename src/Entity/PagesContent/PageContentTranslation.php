<?php

namespace App\Entity\PagesContent;

use App\Entity\Language;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: \App\Repository\PagesContent\PageContentTranslationRepository::class)]
#[ORM\Table(name: 'pages_content_translations')]
class PageContentTranslation
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    #[Groups(['page-content-translations:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: PageContent::class, inversedBy: 'translations')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?PageContent $pageContent = null;

    #[ORM\ManyToOne(targetEntity: Language::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['page-content-translations:read'])]
    private ?Language $language = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['page-content-translations:read'])]
    private ?string $translation = null;
    
    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
    }

    public function getId(): ?string { return $this->id; }

    public function getPageContent(): ?PageContent { return $this->pageContent; }
    public function setPageContent(?PageContent $pageContent): void { $this->pageContent = $pageContent; }

    public function getLanguage(): ?Language { return $this->language; }
    public function setLanguage(?Language $language): void { $this->language = $language; }

    public function getTranslation(): ?string { return $this->translation; }
    public function setTranslation(?string $translation): void { $this->translation = $translation; }
}
