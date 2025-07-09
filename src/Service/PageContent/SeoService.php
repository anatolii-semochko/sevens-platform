<?php

namespace App\Service\PageContent;

use App\Entity\PagesContent\Page;
use App\Entity\PagesContent\PageSeo;
use App\Repository\LanguageRepository;
use App\Repository\PageContent\PageRepository;
use App\Repository\PageContent\PageSeoRepository;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;

readonly class SeoService
{
    public function __construct(
        private RequestStack       $requestStack,
        private LocaleStorage      $localeStorage,
        private PageRepository     $pageRepository,
        private PageSeoRepository  $pageSeoRepository,
        private LanguageRepository $languageRepository,
    ) {}

    public function get(): PageSeo
    {
        if (
            !$seo = $this->pageSeoRepository->findOneByPageLocale(
                $this->localeStorage->getPage(),
                $this->localeStorage->getLocale(),
            )
        ) {
            $seo = $this->createSeo($this->localeStorage->getPage());
        }

        return $this->fillSeoByTerms($seo);
    }

    private function fillSeoByTerms(PageSeo $seo): PageSeo
    {
        $page = $this->localeStorage->getPage();
        if ($page->getUrl() === '/help/page') {
            $seo->setTitle($page->getSeoTerms()['title']);
            $seo->setKeywords($page->getSeoTerms()['keywords']);
            $seo->setDescription($page->getSeoTerms()['description']);
        } else {
            $this->checkTerms($page);
            $seo->setTitle($this->setSeoTerms($seo->getTitle()));
            $seo->setKeywords($this->setSeoTerms($seo->getKeywords()));
            $seo->setDescription($this->setSeoTerms($seo->getDescription()));
        }

        return $seo;
    }

    private function setSeoTerms(?string $text): ?string
    {
        if ($text) {
            foreach ($this->localeStorage->getPage()->getSeoTerms() as $key => $seoTerm) {
                $text = str_replace("{{ $key }}", $seoTerm, $text);
                $text = str_replace("{{$key}}", $seoTerm, $text);
            }
        }

        return $text;
    }

    private function checkTerms(Page $page): void
    {
        $keys = array_filter(array_keys($page->getSeoTerms()));
        if ($keys !== $page->getTerms()) {
            $page->setTerms($keys);
            $this->pageRepository->save($page, true);
        }
    }

    public function getAlternates(): array
    {
        $alternates = [];
        $href = explode('/', $this->requestStack->getCurrentRequest()->server->get('REQUEST_URI'));
        foreach ($this->languageRepository->findActiveLanguages() as $language) {
            $href[1] = $language->getCode();
            $alternates[] = [
                'href' => $this->requestStack->getCurrentRequest()->getSchemeAndHttpHost() . implode('/', $href),
                'hreflang' => $language->getCode(),
            ];
        }

        return $alternates;
    }

    private function createSeo(Page $page): PageSeo
    {
        $seo = $this->pageSeoRepository->create();
        $seo->setPage($page);
        $seo->setLanguage($this->localeStorage->getLanguage());
        $seo->setBreadcrumbs(null);
        $seo->setTitle(null);
        $seo->setDescription(null);
        $seo->setKeywords(null);
        $this->pageSeoRepository->save($seo, true);

        return $seo;
    }
}
