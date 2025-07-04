<?php

namespace App\Service\Help;

use App\Entity\Help\Help;
use App\Repository\Help\HelpContentRepository;
use App\Repository\Help\HelpRepository;
use App\Service\LocaleStorage;
use Doctrine\Common\Collections\ArrayCollection;

readonly class HelpService
{
    public function __construct(
        private LocaleStorage $localeStorage,
        private HelpRepository $helpRepository,
        private HelpContentRepository $helpContentRepository,
    ) {}

    public function getByName(string $name): ?HelpObject
    {
        $help = $this->helpRepository->getByName($name);
        $help->setContents($this->getContent($help));

        return new HelpObject($help);
    }

    public function getByUrl(string $url): ?Help
    {
        $help = $this->helpRepository->getByUrl($url);
        $help->setContents($this->getContent($help));

        return $help;
    }

    private function getContent(Help $help): ArrayCollection
    {
        $helpContent = $this->helpContentRepository->getByHelpId($help->getId(), $this->localeStorage->getLocale());
        if (!$helpContent) {
            $helpContent = $this->helpContentRepository->create($help, $this->localeStorage->getLanguage());
        }

        return new ArrayCollection([$helpContent]);
    }

    public function fetchByIds(array $ids, string $locale): array
    {
        $helps = $this->helpRepository->fetchByIds($ids);
        $helpContents = $this->helpContentRepository->fetchByHelpIds($ids, $locale);
        $helpContentsIndexed = [];
        foreach ($helpContents as $helpContent) {
            $helpContentsIndexed[$helpContent->getHelp()->getId()] = $helpContent;
        }
        foreach ($helps as $help) {
            $helpContent = $helpContentsIndexed[$help->getId()] ?? $this->helpContentRepository->create(
                $help,
                $this->localeStorage->getLanguage(),
            );
            $help->setContents(new ArrayCollection([$helpContent]));
        }

        return $helps;
    }

    public function fetchByName(array $names): array
    {
        $helps = $this->helpRepository->fetchByName($names);
        $helpContents = $this->helpContentRepository->fetchByHelpIds(
            array_map(fn(Help $help) => $help->getId(), $helps),
            $this->localeStorage->getLocale(),
        );
        $helpContentsIndexed = [];
        foreach ($helpContents as $helpContent) {
            $helpContentsIndexed[$helpContent->getHelp()->getId()] = $helpContent;
        }

        $result = [];
        foreach ($helps as $help) {

            $result[$help->getName()] = [
                'title' => $helpContentsIndexed[$help->getId()]->getTitle(),
                'url' => $help->getPageUrl(),
                'shortDescription' => $helpContentsIndexed[$help->getId()]->getShortDescription(),
            ];
        }

        return $result;
    }

    public function fetchAll(string $locale): array
    {
        return $this->fetchByIds(
            array_map(
                fn(Help $help) => $help->getId(),
                $this->helpRepository->fetchAll(),
            ),
            $locale,
        );
    }

    public function findHelpByUrlPath(string $path): HelpObject
    {
        $segments = array_filter(explode('/', trim($path, '/')));
        $url = $segments[count($segments) - 1];

        $locale = $this->localeStorage->getLocale();
        $help = $this->getByUrl($url, $locale);
        $helpObject = new HelpObject($help);
        $helpObject->setNeighbours($this->fetchByIds($helpObject->neighboursIds, $locale));

        return $helpObject;
    }

    public function getTree(): array
    {
        $tree = [];
        $locale = $this->localeStorage->getLocale();
        $helpPages = $this->fetchAll($locale);

        $indexed = [];
        foreach ($helpPages as $help) {
            $indexed[$help->getId()] = new HelpObject($help);
        }

        foreach ($indexed as $helpObject) {
            if (empty($helpObject->parentId)) {
                $tree[] = $helpObject;
            } else {
                if (isset($indexed[$helpObject->parentId])) {
                    $parent = $indexed[$helpObject->parentId];
                    $parent->children[] = $helpObject;
                } else {
                    $tree[] = $helpObject;
                }
            }
        }

        $sortFn = function (HelpObject $a, HelpObject $b) {
            return $a->order <=> $b->order;
        };

        $walk = function (array &$nodes) use (&$walk, $sortFn) {
            usort($nodes, $sortFn);
            foreach ($nodes as $node) {
                if (!empty($node->children)) {
                    $walk($node->children);
                }
            }
        };

        $walk($tree);

        return $tree;
    }
}
