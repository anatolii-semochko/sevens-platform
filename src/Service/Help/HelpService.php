<?php

namespace App\Service\Help;

use App\Entity\Help\Help;
use App\Entity\Help\HelpContent;
use App\Repository\Help\HelpContentRepository;
use App\Repository\Help\HelpRepository;
use App\Service\LanguagesService;
use App\Service\LocaleStorage;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;

readonly class HelpService
{
    public function __construct(
        private EntityManagerInterface $em,
        private LocaleStorage $localeStorage,
        private HelpRepository $helpRepository,
        private HelpContentRepository $helpContentRepository,
        private LanguagesService $languagesService,
    ) {}

    public function getByName(string $url): ?HelpObject
    {
        $help = $this->helpRepository->getByName($url);
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













    // TODO - TEMPORARY FOR TESTING - TO REMOVE
    public function generate(): void
    {
        foreach ($this->helpRepository->fetchAll() as $help) {
            foreach($this->languagesService->fetch() as $language) {
                try {
                    $helpContent = $this->helpContentRepository->getByHelpId($help->getId(), $language->getCode());
                    if (!$helpContent) {
                        $helpContent = new HelpContent();
                        $helpContent->setHelp($help);
                        $helpContent->setLanguage($language);
                    }
                    $helpContent->setTitle($this->generatePseudoText(10, 30, $language->getCode()));
                    $helpContent->setShortDescription($this->generatePseudoText(50, 200, $language->getCode()));
                    $helpContent->setDescription($this->generatePseudoText(300, 3000, $language->getCode()));
                    $helpContent->setSeoDescription($this->generatePseudoText(10, 60, $language->getCode()));

                    $this->em->persist($helpContent);
                    $this->em->flush();
                } catch (\Exception $e) {
                    dd($e->getMessage(), $helpContent ?? 'no help content');
                }
            }
        }
    }

    // TODO - TEMPORARY FOR TESTING - TO REMOVE
    function generatePseudoText($minLength = 100, $maxLength = 300, $language = 'ua'): string
    {
        $alphabets = [
            'ua' => 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя',
            'en' => 'abcdefghijklmnopqrstuvwxyz',
            'es' => 'abcdefghijklmnopqrstuvwxyz',
            'de' => 'abcdefghijklmnopqrstuvwxyz',
        ];

        $alphabet = $alphabets[$language] ?? $alphabets['en'];
        $alphabetLength = mb_strlen($alphabet);
        $text = '';
        $currentLength = 0;

        // Параметри слів і речень
        $minWordLength = 2;
        $maxWordLength = 10;
        $sentenceLength = 5 + random_int(0, 5); // кількість слів у реченні

        while ($currentLength < $maxLength) {
            $sentence = '';
            for ($i = 0; $i < $sentenceLength; $i++) {
                $wordLength = random_int($minWordLength, $maxWordLength);
                $word = '';
                for ($j = 0; $j < $wordLength; $j++) {
                    $index = random_int(0, $alphabetLength - 1);
                    $word .= mb_substr($alphabet, $index, 1);
                }

                if ($i === 0) {
                    // Перша літера речення — велика
                    $word = mb_strtoupper(mb_substr($word, 0, 1)) . mb_substr($word, 1);
                }

                $sentence .= $word;

                if ($i < $sentenceLength - 1) {
                    $sentence .= (random_int(0, 10) > 8) ? ', ' : ' ';
                } else {
                    $sentence .= '. ';
                }
            }

            $sentenceLength = 5 + random_int(0, 5); // нова довжина речення
            $text .= $sentence;
            $currentLength = mb_strlen($text);
            if ($currentLength >= $maxLength) {
                break;
            }
        }

        // Обрізаємо, якщо перевищено maxLength
        if ($currentLength > $maxLength) {
            $text = mb_substr($text, 0, $maxLength);
            $text = preg_replace('/[,.]?[^а-яА-Яa-zA-Z0-9]*$/u', '.', $text); // закінчуємо на крапку
        }

        // Якщо коротше minLength — продовжуємо
        if (mb_strlen($text) < $minLength) {
            $text .= $this->generatePseudoText($minLength - mb_strlen($text), $maxLength - mb_strlen($text), $language);
        }

        return $text;
    }
}
