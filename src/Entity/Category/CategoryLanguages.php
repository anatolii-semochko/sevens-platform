<?php

namespace App\Entity\Category;

use App\Entity\Language;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: "categories_lang")]
#[ORM\UniqueConstraint(name: "fk_categories_lang_unique", columns: ["category_id", "language_id"])]
class CategoryLanguages
{
    #[ORM\Id]
    #[ORM\Column(type: "string", length: 36)]
    #[Groups(['category-lang:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Category::class, inversedBy: "translations")]
    #[ORM\JoinColumn(name: "category_id", referencedColumnName: "id", nullable: false, onDelete: "CASCADE")]
    private Category $category;

    #[ORM\ManyToOne(targetEntity: Language::class)]
    #[ORM\JoinColumn(name: "language_id", referencedColumnName: "id", nullable: false)]
    #[Groups(['category-lang:read'])]
    private Language $language;

    #[ORM\Column(type: "string", length: 64)]
    #[Groups(['category-lang:read'])]
    private string $name = '';

    #[ORM\Column(type: "string", length: 64)]
    #[Groups(['category-lang:read'])]
    private string $title = '';

    #[ORM\Column(type: "text", nullable: true)]
    #[Groups(['category-lang:read'])]
    private ?string $logoAlt = null;

    #[ORM\Column(type: "text")]
    #[Groups(['category-lang:read'])]
    private string $shortDescription = '';

    #[ORM\Column(type: "text")]
    #[Groups(['category-lang:read'])]
    private string $description = '';

    public function __construct()
    {
        $this->id = Uuid::v4()->toRfc4122();
    }

    public function getId(): string { return $this->id; }
    public function setId(string $id): void { $this->id = $id; }

    public function getCategory(): Category { return $this->category; }
    public function setCategory(Category $category): void { $this->category = $category; }

    public function getLanguage(): Language { return $this->language; }
    public function setLanguage(Language $language): void { $this->language = $language; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = trim($name); }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): void { $this->title = trim($title); }

    public function getLogoAlt(): ?string { return $this->logoAlt; }
    public function setLogoAlt(?string $logoAlt): void { $this->logoAlt = trim($logoAlt); }

    public function getShortDescription(): string { return $this->shortDescription; }
    public function setShortDescription(string $shortDescription): void { $this->shortDescription = trim($shortDescription); }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): void { $this->description = trim($description); }
}
