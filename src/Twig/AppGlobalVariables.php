<?php

namespace App\Twig;

use App\Entity\Category\CategoryConstants;
use App\Repository\Category\CategoryRepository;
use App\Service\Help\HelpService;
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
        private readonly string $publicFolder,
        private readonly string $translationsFolder,
        private readonly string $helpTranslationsFolder,
        private readonly RequestStack $requestStack,
        private readonly LanguagesService $languagesService,
        private readonly TermService $termService,
        private readonly HelpService $helpService,
        private readonly SeoService $seoService,
        private readonly CategoryRepository $categoryRepository,
    ) {}

    public function getGlobals(): array
    {
        $request = $this->requestStack->getCurrentRequest();
        $category = $this->categoryRepository->getByUrl(CategoryConstants::MATERIALS_URL);
        $categories = $this->categoryRepository->fetchCategories($category->getId());

        return [
            'current_locale' => $request->getLocale(),
            'global' => [
                'host' => $request->getSchemeAndHttpHost(),
                'canonicalUrl' => $request->getUri(),
                'publicFolder' => $this->publicFolder,
                'translationsFolder' => $this->translationsFolder,
                'helpTranslationsFolder' => $this->helpTranslationsFolder,
                'seo' => $this->seoService->get(),
                'seoAlternates' => $this->seoService->getAlternates(),
                'languages' => $this->languagesService->fetch(),
                'mainLanguage' => $this->languagesService->getMainLanguage(),
                'categories' => $categories,
            ]
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('t', [$this, 'getTerm']),
            new TwigFunction('h', [$this->helpService, 'getHelp']),
        ];
    }

    public function getTerm(string $term, array $options = []): string
    {
        return $options['private'] ?? false ? $this->termService->getPrivate($term) : $this->termService->get($term);
    }
}
