<?php

namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;
use App\Repository\LanguageRepository;
use Symfony\Component\HttpFoundation\RequestStack;

class AppGlobalVariables extends AbstractExtension implements GlobalsInterface
{
    public function __construct(
        private LanguageRepository $languageRepository,
        private RequestStack $requestStack,
    ) {}

    public function getGlobals(): array
    {
        $request = $this->requestStack->getCurrentRequest();
        $locale = $request ? $request->getLocale() : 'en';

        return [
            'languages' => $this->languageRepository->findActiveLanguages(),
            'current_locale' => $locale,
            'seo_defaults' => [
                'title' => 'Default Title',
                'description' => 'Default Description',
            ],
        ];
    }
}
