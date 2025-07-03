<?php

namespace App\Twig;

use App\Entity\Category\CategoryConstants;
use App\Exception\NotFoundException;
use App\Repository\Category\CategoryRepository;
use App\Service\Help\HelpService;
use App\Service\LanguagesService;
use App\Service\PageContent\SeoService;
use App\Service\PageContent\TermService;
use Exception;
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
            $html = $this->twig->render('help/help-link.html.twig', [
                'help' => $this->helpService->getByName($helpName),
            ]);
        } catch (NotFoundException $e) {
            $html = "<div class='text-danger font-weight-bold'>$helpName</div>";
        } catch (Exception $e) {
            dd($e); // TODO throw InternalServerException
        }

        return new Markup($html, 'UTF-8');
    }
}
