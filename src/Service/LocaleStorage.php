<?php
namespace App\Service;

use App\Entity\Language\Language;
use App\Entity\PagesContent\Page;

class LocaleStorage
{
    private string $currentLocale;
    private Language $language;
    public string $url;
    private Page $page;

    public function setLocale(string $locale): void
    {
        $this->currentLocale = $locale;
    }
    public function getLocale(): ?string
    {
        return $this->currentLocale;
    }

    public function setLanguage(Language $language): void
    {
        $this->language = $language;
    }
    public function getLanguage(): Language
    {
        return $this->language;
    }

    public function settUrl(string $url): void
    {
        $this->url = $url;
    }
    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setPage(Page $page): void
    {
        $this->page = $page;
    }
    public function getPage(): Page
    {
        return $this->page;
    }
}
