<?php

namespace App\Service\PageContent;

use App\Entity\PagesContent\Page;
use App\Entity\PagesContent\PageSeo;
use App\Repository\LanguageRepository;
use App\Repository\PageContent\PageSeoRepository;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;

readonly class SeoService
{
    public function __construct(
        private RequestStack       $requestStack,
        private LocaleStorage      $localeStorage,
        private PageSeoRepository  $pageSeoRepository,
        private LanguageRepository $languageRepository,
    ) {}

    public function get(): PageSeo
    {
        // TODO - Add page seo terms {material.name}

        if (!$this->localeStorage->getPage()) {
            // TODO - Investigate this case when no PAGE initiated !!!
            return $this->getEmptyPageSeo();
        }

        if (
            !$seo = $this->pageSeoRepository->findOneByPageLocale(
                $this->localeStorage->getPage(),
                $this->localeStorage->getLocale(),
            )
        ) {
            // TODO - Add messages about empty SEO translations to Admin Panel
            $seo = $this->createSeo($this->localeStorage->getPage());
        }

        return $seo;
    }

    public function getAlternates(): array
    {
        // TODO - Fix hreflang (en-us) !!!
        // TODO - Fix hreflang=“x-default“ in template !!!
        $alternates = [];
        foreach ($this->languageRepository->findActiveLanguages() as $language) {
            $alternates[] = [
                'href' => $this->requestStack->getCurrentRequest()->getSchemeAndHttpHost() .
                    // TODO - REQUEST_URI need to be changed according list of available language locales !!!
                    $this->requestStack->getCurrentRequest()->server->get('REQUEST_URI') .
                    $language->getCode() . '/',
                'hreflang' => $language->getCode(),
            ];
        }

        return $alternates;
    }

    private function getEmptyPageSeo(): PageSeo
    {
        $seo = $this->pageSeoRepository->create();
        $seo->setBreadcrumbs(null);
        $seo->setTitle(null);
        $seo->setDescription(null);
        $seo->setKeywords(null);

        return $seo;
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
