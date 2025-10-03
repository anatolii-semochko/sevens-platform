<?php

namespace App\Twig;

use App\Entity\Category\CategoryConstants;
use App\Repository\Category\CategoryRepository;
use App\Service\Help\HelpService;
use App\Service\LanguagesService;
use App\Service\PageContent\SeoService;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\TwigFunction;

class AppGlobalVariables extends AbstractExtension implements GlobalsInterface
{
    public function __construct(
        private readonly array $path,
        private readonly RequestStack $requestStack,
        private readonly LanguagesService $languagesService,
        private readonly HelpService $helpService,
        private readonly SeoService $seoService,
        private readonly CategoryRepository $categoryRepository,
    ) {}

    public function getGlobals(): array
    {
        $request = $this->requestStack->getCurrentRequest();
        $category = $this->categoryRepository->getByUrl(CategoryConstants::MATERIALS_URL);
        $categories = $this->categoryRepository->fetchCategories($category->getId());

//        dd($categories, $categories[0]->getLogo());

        return [
            'current_locale' => $request->getLocale(),
            'global' => [
                'host' => $request->getSchemeAndHttpHost(),
                'canonicalUrl' => $request->getUri(),
                'path' => $this->path,
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
            new TwigFunction('h', [$this->helpService, 'getHelp']),
        ];
    }
}
