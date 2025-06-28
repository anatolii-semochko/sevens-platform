<?php

namespace App\Twig;

use App\Service\LanguagesService;
use App\Service\PageContent\SeoService;
use App\Service\PageContent\TermService;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\TwigFunction;

class AppGlobalVariables extends AbstractExtension implements GlobalsInterface
{
    public function __construct(
        private RequestStack $requestStack,
        private LanguagesService $languagesService,
        private TermService $termService,
        private SeoService $seoService,
    ) {}

    public function getGlobals(): array
    {   
        $request = $this->requestStack->getCurrentRequest();

        return [
            'currentLocale' => $request->getLocale(),
            'global' => [
                'host' => $request->getSchemeAndHttpHost(),
                'canonicalUrl' => $request->getUri(),
                'seo' => $this->seoService->get(),
                'seoAlternates' => $this->seoService->getAlternates(),
                'languages' => $this->languagesService->fetch(),
                'mainLanguage' => $this->languagesService->getMainLanguage(),
            ]
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('t', [$this, 'getTerm']),
            new TwigFunction('tp', [$this, 'getTermPrivate']),
        ];
    }

    public function getTerm(string $term): string
    {
        return $this->termService->get($term);
    }

    public function getTermPrivate(string $term): string
    {
        return $this->termService->getPrivate($term);
    }
}
