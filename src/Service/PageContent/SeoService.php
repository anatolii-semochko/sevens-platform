<?php

namespace App\Service\PageContent;

use App\Entity\PagesContent\PageSeo;
use App\Repository\LanguageRepository;
use App\Repository\PageContent\PageSeoRepository;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;

class SeoService
{
    public function __construct(
        private RequestStack $requestStack,
        private LocaleStorage $localeStorage,
        private PageSeoRepository $pageSeoRepository,
        private LanguageRepository $languageRepository,
    ) {}
    
    public function get(): PageSeo
    {
        // TODO - Add page seo terms {material.name}
        // TODO - Add messages about empty SEO translations to Admin Panel
        if (
            !$seo = $this->pageSeoRepository->findOneByPageLocale(
                $this->localeStorage->getPage(),
                $this->localeStorage->getLocale(),
            )
        ) {
            $seo = $this->pageSeoRepository->create();
            $seo->setPage($this->localeStorage->getPage());
            $seo->setLanguage($this->localeStorage->getLanguage());
            $seo->setBreadcrumbs(null);
            $seo->setTitle(null);
            $seo->setDescription(null);
            $seo->setKeywords(null);
            $this->pageSeoRepository->save($seo, true);
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
                    $this->localeStorage->getUrl() .
                    $language->getCode() . '/',
                'hreflang' => $language->getCode(),
            ];
        }

        return $alternates;
    }
}
