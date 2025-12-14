<?php

namespace App\Service\PageContent;

use App\Service\LocaleStorage;

readonly class SeoLdService
{
    public function __construct(private LocaleStorage $localeStorage)
    {

    }

    public function get(): string
    {
        $page = $this->localeStorage->getPage();

        $data = [
            'title' => 'test',
            'page' => $page->getUrl(),
            'test' => [
                'seoLd' => 'test',
                'page' => $page->getUrl(),
            ],
        ];

        return json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
