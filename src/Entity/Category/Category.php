<?php

namespace App\Entity\Category;

use App\Service\LocaleStorage;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Serializer\Annotation\MaxDepth;

#[ORM\Entity]
#[ORM\Table(name: "categories")]
#[ORM\UniqueConstraint(name: "unique", columns: ["name", "parent_id"])]
#[ORM\UniqueConstraint(name: "url_activity_unique", columns: ["activity_parent_id", "url"])]
#[ORM\UniqueConstraint(name: "url_main_unique", columns: ["main_parent_id", "url"])]
class Category
{
    private ?string $currentLocale = null;

    #[ORM\Id]
    #[ORM\Column(type: "string", length: 36)]
    #[Groups(['category:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'childrenCategories')]
    #[ORM\JoinColumn(name: "parent_id", referencedColumnName: "id", nullable: true, onDelete: "SET NULL")]
    private ?self $parentCategory = null;

    #[ORM\Column(name: "main_parent_id", type: "string", length: 36, nullable: true)]
    #[Groups(['category:read'])]
    private ?string $mainParentId = null;

    #[ORM\Column(name: "activity_parent_id", type: "string", length: 36, nullable: true)]
    #[Groups(['category:read'])]
    private ?string $activityParentId = null;

    #[ORM\Column(name: "active", type: "integer", length: 1, nullable: false, options: ["unsigned" => true, "default" => 0])]
    #[Groups(['category:read'])]
    private int $active = 0;

    #[ORM\Column(name: "`order`", type: "integer", options: ["unsigned" => true])]
    #[Groups(['category:read'])]
    private int $order = 0;

    #[ORM\Column(type: "smallint", options: ["unsigned" => true])]
    #[Groups(['category:read'])]
    private int $level = 0;

    #[ORM\Column(type: "string", length: 64)]
    #[Groups(['category:read'])]
    private string $name;

    #[ORM\Column(type: "string", length: 32, nullable: true)]
    #[Groups(['category:read'])]
    private ?string $url = null;

    #[ORM\Column(type: "string", length: 64, nullable: true)]
    #[Groups(['category:read'])]
    private ?string $logo = null;

    #[ORM\Column(type: "string", length: 1024, nullable: true)]
    #[Groups(['category:read'])]
    private ?string $parents = null;

    #[ORM\Column(type: "text", nullable: true)]
    #[Groups(['category:read'])]
    private ?string $children = null;

    #[ORM\OneToMany(targetEntity: self::class, mappedBy: "parentCategory")]
    private Collection $childrenCategories;

    #[ORM\Column(type: "text", nullable: true)]
    #[Groups(['category:read'])]
    private ?string $childrenInside = null;

    #[ORM\Column(type: "text", nullable: true)]
    #[Groups(['category:read'])]
    private ?string $path = null;

    #[ORM\OneToMany(mappedBy: "category", targetEntity: CategoryLanguages::class, cascade: ["persist", "remove"])]
    #[MaxDepth(1)]
    #[Groups(['category:read'])]
    private Collection $translations;

    public function __construct(private LocaleStorage $localeStorage)
    {
        $this->translations = new ArrayCollection();
    }

    public function getId(): string { return $this->id; }

    public function getParentId(): ?string { return $this->parentId; }

    public function getMainParentId(): ?string { return $this->mainParentId; }

    public function getActivityParentId(): ?string { return $this->activityParentId; }

    public function getActive(): int { return $this->active; }

    public function getOrder(): int { return $this->order; }

    public function getLevel(): int { return $this->level; }

    public function getName(): string { return $this->name; }

    public function getUrl(): ?string { return $this->url; }

    public function getLogo(): ?string { return $this->logo; }

    public function getParents(): ?string { return $this->parents; }

    public function getChildrenInside(): ?string { return $this->childrenInside; }

    public function getPath(): ?string { return $this->path; }

    public function getTranslations(): Collection { return $this->translations; }

    public function getParent(): ?self
    {
        if (!$this->parentCategory) {
            return null;
        }
        $this->parentCategory->getTranslations();

        return $this->parentCategory;
    }

    public function getChildren(): array
    {
        return $this->childrenCategories->map(function (self $child) {
            $child->getTranslations();
            return $child;
        })->toArray();
    }

    public function setCurrentLocale(?string $locale): void
    {
        $this->currentLocale = $locale;
    }
    
    private function getTranslationByLocale(): ?CategoryLanguages
    {
        foreach ($this->translations as $translation) {
            if ($translation->getLanguage()->getCode() === $this->currentLocale) {
                return $translation;
            }
        }

        return null;
    }

    public function getNameTranslation(): string
    {
        return $this->getTranslationByLocale()?->getName() ?? $this->translations[0]?->getName() ?? $this->name;
    }

    public function getTitleTranslation(): string
    {
        return $this->getTranslationByLocale()?->getTitle() ?? $this->translations[0]?->getTitle() ?? '';
    }

    public function getLogoAltTranslation(): string
    {
        return $this->getTranslationByLocale()?->getLogoAlt() ?? $this->translations[0]?->getLogoAlt() ?? '';
    }

    public function getShortDescriptionTranslation(): string
    {
        return $this->getTranslationByLocale()?->getShortDescription() ?? $this->translations[0]?->getShortDescription() ?? '';
    }

    public function getDescriptionTranslation(): string
    {
        return $this->getTranslationByLocale()?->getDescription() ?? $this->translations[0]?->getDescription() ?? '';
    }
}
