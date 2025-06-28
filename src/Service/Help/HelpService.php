<?php

namespace App\Service\Help;

use App\Entity\Help\HelpContent;
use App\Repository\Help\HelpContentRepository;
use App\Repository\Help\HelpRepository;
use App\Entity\Help\Help;
use App\Service\LanguagesService;
use App\Service\LocaleStorage;
use Doctrine\ORM\EntityManagerInterface;

class HelpService
{
    public function __construct(
        private EntityManagerInterface $em,
        private LocaleStorage $localeStorage,
        private readonly HelpRepository $helpRepository,
        private readonly HelpContentRepository $helpContentRepository,
        private readonly LanguagesService $languagesService,
    ) {}

    public function findHelpByUrlPath(string $path): ?Help
    {
        $segments = array_filter(explode('/', trim($path, '/')));
        $url = $segments[count($segments) - 1];


//        Така вибірка не "відсікає" зайві контенти в Doctrine-серіалізації. Щоб після завантаження обмежити масив contents тільки одним HelpContent для мови $locale, використай:
//        Фільтрація після завантаження (на рівні PHP)
//        $help = $this->findByUrl($url, $locale);
//        $help->getContents()->filter(fn($c) => $c->getLanguage()->getCode() === $locale);
//        foreach ($help->getChildren() as $child) {
//            $child->getContents()->filter(fn($c) => $c->getLanguage()->getCode() === $locale);
//        }

        $locale = $this->localeStorage->getLocale();
        $help = $this->helpRepository->findByUrl($url, $locale);

//        if ($help) {
//            foreach ($help->getChildren() as $child) {
//                $filtered = $child->getContents()->filter(
//                    fn($content) => $content->getLanguage()->getCode() === $locale
//                );
//                $child->getContents()->clear();
//                foreach ($filtered as $item) {
//                    $child->addContent($item);
//                }
//            }
//        }

        return $help;
    }

    public function getBreadcrumbs(): array
    {

        return [];
    }

//    public function getHelpTree(string $parentId = null): array
//    {
//        $tree = [];
//        $children = $this->helpRepository->findChildren($parentId);
//
//        foreach ($children as $child) {
//            $tree[] = [
//                'id' => $child->getId(),
//                'name' => $child->getName(),
//                'url' => $child->getUrl(),
//                'children' => $this->getHelpTree($child->getId()),
//            ];
//        }
//
//        return $tree;
//    }




    // TODO - TEMPORARY FOR TESTING - TO REMOVE
    public function generate(): void
    {
        foreach ($this->helpRepository->fetchAll() as $help) {
            foreach($this->languagesService->fetch() as $language) {
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
            }
        }
    }

    // TODO - TEMPORARY FOR TESTING - TO REMOVE
    function generatePseudoText($minLength = 100, $maxLength = 300, $language = 'ua') {
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
            $text .= generatePseudoText($minLength - mb_strlen($text), $maxLength - mb_strlen($text), $language);
        }

        return $text;
    }

}
