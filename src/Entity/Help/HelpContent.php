<?php

namespace App\Entity\Help;

use App\Entity\Language;
use App\Repository\Help\HelpContentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: HelpContentRepository::class)]
#[ORM\Table(name: 'help_content')]
#[ORM\UniqueConstraint(name: 'unique', columns: ['help_id', 'language_id'])]
class HelpContent
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['help-content:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Help::class, inversedBy: 'contents')]
    #[ORM\JoinColumn(name: 'help_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Help $help;

    #[ORM\ManyToOne(targetEntity: Language::class)]
    #[ORM\JoinColumn(name: 'language_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    #[Groups(['help-content:read'])]
    private Language $language;

    #[ORM\Column(type: 'string', length: 70, nullable: true)]
    #[Groups(['help-content:read'])]
    private ?string $title = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['help-content:read'])]
    private ?string $seoKeywords = null;

    #[ORM\Column(type: 'string', length: 160, nullable: true)]
    #[Groups(['help-content:read'])]
    private ?string $seoDescription = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['help-content:read'])]
    private ?string $shortDescription = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['help-content:read'])]
    private ?string $description = null;

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
    }

    public function getId(): string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getHelp(): Help { return $this->help; }
    public function setHelp(Help $help): void { $this->help = $help; }

    public function getLanguage(): Language { return $this->language; }
    public function setLanguage(Language $language): void { $this->language = $language; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $title): void { $this->title = $title; }

    public function getSeoKeywords(): ?string { return $this->seoKeywords; }
    public function setSeoKeywords(?string $seoKeywords): void { $this->seoKeywords = $seoKeywords; }

    public function getSeoDescription(): ?string { return $this->seoDescription; }
    public function setSeoDescription(?string $seoDescription): void { $this->seoDescription = $seoDescription; }

    public function getShortDescription(): ?string { return $this->shortDescription; }
    public function setShortDescription(?string $shortDescription): void { $this->shortDescription = $shortDescription; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): void { $this->description = $description; }
}
