<?php
namespace App\Service;

class LocaleStorage
{
    private ?string $currentLocale = null;

    public function setLocale(string $locale): void
    {
        $this->currentLocale = $locale;
    }

    public function getLocale(): ?string
    {
        return $this->currentLocale;
    }
}
