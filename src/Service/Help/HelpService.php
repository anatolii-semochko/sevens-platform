<?php

namespace App\Service\Help;

use App\Entity\Help\Help;
use App\Exception\NotFoundException;
use App\Repository\Help\HelpContentRepository;
use App\Repository\Help\HelpRepository;
use App\Service\LocaleStorage;
use Doctrine\Common\Collections\ArrayCollection;
use Exception;
use Twig\Environment;
use Twig\Markup;

class HelpService
{
    private array $helpFileData = [];

    public function __construct(
        private readonly string $publicFolder,
        private readonly string $helpTranslationsFolder,
        private readonly LocaleStorage $localeStorage,
        private readonly Environment $twig,
        private readonly HelpRepository $helpRepository,
        private readonly HelpContentRepository $helpContentRepository,
    ) {}

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

    public function getHelp(string $helpName): Markup
    {
        try {
            $html = $this->twig->render('help/help-link.html.twig', [
                'help' => $this->getHelpFromFile($helpName) ?? [
                    'title' => $helpName,
                    'pageUrl' => null,
                    'shortDescription' => null,
                ],
            ]);
        } catch (NotFoundException $e) {
            $html = "<div class='text-danger font-weight-bold'>$helpName</div>";
        } catch (Exception $e) {
            dd($e); // TODO throw InternalServerException
        }

        return new Markup($html, 'UTF-8');
    }

    private function getHelpFromFile(string $helpName): ?array
    {
        $file = $this->publicFolder . $this->helpTranslationsFolder . "/help.{$this->localeStorage->getLocale()}.json";
        try {
            if (!$this->helpFileData) {
                $this->helpFileData = json_decode(file_get_contents($file), true);
            }
        } catch (Exception $e) {
            return null;
        }

        return $this->helpFileData[$helpName] ?? null;
    }
}
