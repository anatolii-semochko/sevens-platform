<?php

namespace App\Service\PageContent;

use App\Repository\PageContent\PageContentRepository;
use App\Service\LocaleStorage;
use Symfony\Component\Uid\Uuid;
use Doctrine\ORM\EntityManagerInterface;

readonly class TermService
{
    public function __construct(
        private LocaleStorage          $localeStorage,
        private EntityManagerInterface $em,
        private PageContentRepository  $pageContentRepository,
    ) {}

    /**
     * Returns term translation not assigned to any page
     */
    public function get(string $term): string
    {
        return $this->getTranslation($term);
    }

    /**
     * Returns term translation assigned to the current page by URL
     */
    public function getPrivate(string $term): string
    {
        return $this->getTranslation($term, true);
    }

    private function getTranslation(string $term, bool $private = false): string
    {
        $pageContent = $this->pageContentRepository->findOneByTermUrlLocale(
            $term,
            $private ? $this->localeStorage->getUrl() : null,
            $this->localeStorage->getLocale(),
        );

        if ($pageContent) {
            return count($pageContent->getTranslations()) ?
                $pageContent->getTranslations()[0]?->getTranslation() :
                $term;
        }

        $pageContent = $this->pageContentRepository->create();
        $pageContent->setId(Uuid::v4());
        $pageContent->setTerm($term);
        if ($private) {
            $pageContent->setPage($this->localeStorage->getPage());;
        }
        $this->em->persist($pageContent);
        $this->em->flush();

        return $term;
    }
}
