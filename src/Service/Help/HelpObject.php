<?php

namespace App\Service\Help;
use App\Entity\Help\Help;

class HelpObject
{
    public readonly string $id;
    public readonly ?string $parentId;
    public readonly array $childrenIds;
    public readonly array $parentIds;
    public array $neighboursIds;

    public readonly int $order;

    public readonly string $url;
    public readonly string $pageUrl;

    public readonly string $name;
    public readonly string $title;
    public readonly string $shortDescription;
    public readonly string $description;
    public readonly object $seo;


    public array $parents = [];
    public array $children = [];

    public array $breadcrumbs = [];

    public function __construct(Help $help) {
        $this->id = $help->getId();
        $this->parentId = $help->getParentId();
        $this->order = $help->getOrder();
        $this->url = $help->getUrl();
        $this->pageUrl = $this->getPageUrl($help);
        $this->name = $help->getName();
        $this->title = $help->getContents()[0]?->getTitle();
        $this->shortDescription = $help->getContents()[0]?->getShortDescription();
        $this->description = $help->getContents()[0]?->getDescription();
        $this->seo = $this->getSeo($help);
        $this->parentIds = $help->getParents() ? explode(',', $help->getParents()) : [];
        $this->childrenIds = $help->getChildrenData() ? explode(',', $help->getChildrenData()) : [];
        $this->neighboursIds = array_merge($this->parentIds, $this->childrenIds);
    }

    private function getPageUrl(Help $help): string
    {
        $pageUrl = [];
        foreach (json_decode($help->getPath(), true) ?? [] as $parent) {
            $pageUrl[] = $parent['url'];
        }
        $pageUrl[] = $this->url;

        return implode('/', $pageUrl);
    }

    private function getSeo(Help $help): Object
    {

        return (object) [
            'title' => $this->title,
            'keywords' => $help->getContents()[0]?->getSeoKeywords(),
            'description' => $help->getContents()[0]?->getSeoDescription(),
        ];
    }

    public function setNeighbours(array $neighbours): void
    {
        $indexed = [];
        foreach ($neighbours as $help) {
            $indexed[$help->getId()] = $help;
        }

        $breadcrumbsUrl = [];
        foreach ($this->parentIds as $parentId) {
            $this->parents[] = new self($indexed[$parentId]);
            $breadcrumbsUrl[] = $indexed[$parentId]->getUrl();
            $this->breadcrumbs[] = (object) [
                'url' => implode('/', $breadcrumbsUrl),
                'title' => $indexed[$parentId]->getContents()[0]?->getTitle(),
            ];
        }
        $this->breadcrumbs[] = (object) [
            'title' => $this->title,
        ];

        foreach ($this->childrenIds as $childId) {
            if (!isset($indexed[$childId])) {
                continue;
            }
            $this->children[] = new self($indexed[$childId]);
        }

        usort($this->children, function (HelpObject $a, HelpObject $b) {
            return $a->order <=> $b->order;
        });
    }
}
