<?php

namespace App\Service;

use App\Entity\Language\Language;
use App\Exception\NotFoundException;
use App\Repository\LanguageRepository;

readonly class LanguagesService
{
    public function __construct(private LanguageRepository $repository) {}

    public function fetchLocales(): array
    {
        return array_map(fn($language) => $language->getCode(), $this->repository->findAll());
    }

    public function fetch(): array
    {
        return $this->repository->findActiveLanguages();
    }

    public function getMainLanguage(): ?Language
    {
        if (!$language = $this->repository->findMainLanguage()) {
            throw new NotFoundException('Main language not found');
        }

        return $language;
    }

    public function getByLocale(string $locale): Language
    {
        return $this->repository->getByLocale($locale);
    }
}
