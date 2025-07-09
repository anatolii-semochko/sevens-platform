<?php

namespace App\Service\PageContent;

use App\Entity\PagesContent\Page;
use App\Repository\PageContent\PageRepository;
use App\Service\LocaleStorage;

readonly class PageService
{
    public function __construct(
        private LocaleStorage $localeStorage,
        private PageRepository $pageRepository,
    ) {}

    public function findByUrl(string $url): Page
    {
        if (!$page = $this->pageRepository->findByUrl($url)) {
            $page = $this->pageRepository->create();
            $page->setUrl($url);
            $this->pageRepository->save($page, true);
        }

        return $page;
    }

    public function init(
        string $mainUrl,
    ): void {
        $this->localeStorage->setPage($this->findByUrl($mainUrl));;
    }
}
