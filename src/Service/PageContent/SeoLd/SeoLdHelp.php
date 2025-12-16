<?php

namespace App\Service\PageContent\SeoLd;

use App\Repository\LanguageRepository;
use App\Service\Help\HelpObject;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class SeoLdHelp extends SeoLd
{
    public function __construct(
        private RequestStack $requestStack,
        private TranslatorInterface $translator,
        private LocaleStorage $localeStorage,
        private UrlGeneratorInterface $urlGenerator,
        private LanguageRepository $languageRepository,
    ) {
        parent::__construct($this->requestStack, $this->localeStorage, $this->translator);
    }

    public function getHelpMainPage(array $params): array
    {
        /** @var HelpObject[] $tree */
        $tree = $params[0];
        $languages = $this->languageRepository->findActiveLanguages();
        $mainLanguageCode = $this->languageRepository->findMainLanguage()->getCode();

        // Collect all help pages from tree recursively
        $allPages = [];
        $collectPages = function (array $nodes) use (&$collectPages, &$allPages) {
            foreach ($nodes as $node) {
                $allPages[] = $node;
                if (!empty($node->children)) {
                    $collectPages($node->children);
                }
            }
        };
        $collectPages($tree);

        // Build ItemList elements
        $itemListElement = [];
        foreach ($allPages as $key => $page) {
            if (!$page->pageUrl) {
                continue;
            }
            $itemListElement[] = [
                '@type' => 'ListItem',
                'position' => $key + 1,
                'name' => $page->title,
                'url' => $this->urlGenerator->generate('help_page', ['slugPath' => $page->pageUrl]),
            ];
        }

        return [
            '@context' => $this->schemaOrg(),
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => $this->organizationDomain() . '#website',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain() . "/$mainLanguageCode/",
                    'description' => $this->organizationDescription(),
                    'publisher' => [
                        '@id' => $this->organizationDomain() . '#organization',
                    ],
                    'inLanguage' => array_map(fn ($language) => $language->getCode(), $languages),
                ],
                [
                    '@type' => 'CollectionPage',
                    '@id' => $this->currentPageUrl(),
                    'url' => $this->currentPageUrl(),
                    'name' => $this->t('Help Center'),
                    'description' => $this->t('Documentation and help pages for understanding platform features and functionality'),
                    'isPartOf' => [
                        '@id' => $this->organizationDomain() . '#website',
                    ],
                    'mainEntity' => [
                        '@id' => '#help-pages-list',
                    ],
                    'inLanguage' => $this->currentLocale(),
                ],
                [
                    '@type' => 'ItemList',
                    '@id' => '#help-pages-list',
                    'name' => $this->t('Help Pages'),
                    'itemListOrder' => $this->schemaOrg('ItemListOrderAscending'),
                    'numberOfItems' => count($itemListElement),
                    'itemListElement' => $itemListElement,
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain() . '#organization',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ]
            ]
        ];
    }

    public function getHelpSubPage(array $params): array
    {
        /** @var HelpObject $help */
        $help = $params[0];

        // Build BreadcrumbList
        $breadcrumbList = [
            '@type' => 'BreadcrumbList',
            '@id' => '#breadcrumb',
            'itemListElement' => [],
        ];

        // Add Help home as first breadcrumb
        $breadcrumbList['itemListElement'][] = [
            '@type' => 'ListItem',
            'position' => 1,
            'name' => $this->t('Help'),
            'item' => $this->urlGenerator->generate('help_index'),
        ];

        // Add parent breadcrumbs
        foreach ($help->breadcrumbs as $index => $breadcrumb) {
            $item = [
                '@type' => 'ListItem',
                'position' => $index + 2,
                'name' => $breadcrumb->title,
            ];
            if (isset($breadcrumb->url)) {
                $item['item'] = $this->urlGenerator->generate('help_page', ['slugPath' => $breadcrumb->url]);
            }
            $breadcrumbList['itemListElement'][] = $item;
        }

        // Build Article object
        $article = [
            '@type' => 'Article',
            '@id' => '#article',
            'headline' => $help->title,
            'description' => $help->shortDescription ?: $help->seo->description,
            'url' => $this->currentPageUrl(),
            'author' => [
                '@type' => 'Organization',
                'name' => $this->organizationName(),
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $this->organizationName(),
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => $this->organizationLogo(),
                ],
            ],
        ];

        // Build WebPage object
        $webPage = [
            '@type' => 'WebPage',
            '@id' => $this->currentPageUrl(),
            'url' => $this->currentPageUrl(),
            'name' => $help->title,
            'description' => $help->shortDescription ?: $help->seo->description,
            'breadcrumb' => ['@id' => '#breadcrumb'],
            'mainEntity' => ['@id' => '#article'],
            'isPartOf' => [
                '@id' => $this->organizationDomain() . '#website',
            ],
            'inLanguage' => $this->currentLocale(),
        ];

        $graph = [
            $webPage,
            $breadcrumbList,
            $article,
        ];

        // Add children ItemList if there are any
        if (!empty($help->children)) {
            $childrenItemList = [
                '@type' => 'ItemList',
                '@id' => '#children-pages',
                'name' => $this->t('Related Help Pages'),
                'itemListOrder' => $this->schemaOrg('ItemListOrderAscending'),
                'numberOfItems' => count($help->children),
                'itemListElement' => [],
            ];

            foreach ($help->children as $index => $child) {
                if (!$child->pageUrl) {
                    continue;
                }
                $childrenItemList['itemListElement'][] = [
                    '@type' => 'ListItem',
                    'position' => $index + 1,
                    'name' => $child->title,
                    'url' => $this->urlGenerator->generate('help_page', ['slugPath' => $child->pageUrl]),
                ];
            }

            $graph[] = $childrenItemList;
        }

        return [
            '@context' => $this->schemaOrg(),
            '@graph' => $graph,
        ];
    }
}
