<?php

namespace App\Twig;

use App\Service\Help\HelpService;
use App\Service\LanguagesService;
use App\Service\PageContent\SeoService;
use App\Service\PageContent\TermService;
use Twig\Environment;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Markup;
use Twig\TwigFunction;

class AppGlobalVariables extends AbstractExtension implements GlobalsInterface
{
    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly Environment $twig,
        private readonly LanguagesService $languagesService,
        private readonly TermService $termService,
        private readonly HelpService $helpService,
        private readonly SeoService $seoService,
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
            new TwigFunction('h', [$this, 'getHelp']),
        ];
    }

    public function getTerm(string $term, array $options = []): string
    {
        return $options['private'] ?? false ? $this->termService->getPrivate($term) : $this->termService->get($term);
    }

    public function getHelp(string $helpName): Markup
    {
        try {
            return new Markup($this->twig->render('help/help-link.html.twig', [
                'help' => $this->helpService->findByName($helpName),
            ]), 'UTF-8');
        } catch (\Exception $e) {
            dd($e); // TODO
        }
    }
}
