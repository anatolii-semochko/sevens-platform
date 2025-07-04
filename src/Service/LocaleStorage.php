<?php
namespace App\Service;

use App\Entity\Language\Language;
use App\Entity\PagesContent\Page;

class LocaleStorage
{
    private string $currentLocale = ''; // TODO - Set locale as not initialized and FIX Page 404 LANGUAGE !!!
    private Language $language;
    private ?Page $page = null;

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

    public function setPage(Page $page): void
    {
        $this->page = $page;
    }
    public function getPage(): ?Page
    {
        return $this->page;
    }
}
