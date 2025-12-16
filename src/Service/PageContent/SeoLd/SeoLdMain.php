<?php

namespace App\Service\PageContent\SeoLd;

use App\Entity\Material\Material;
use App\Repository\LanguageRepository;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class SeoLdMain extends SeoLd
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

    public function getMainPage(array $params): array
    {
        /** @var Material[] $materials */
        $materials = $params[0];
        $languages = $this->languageRepository->findActiveLanguages();
        $mainLanguageCode = $this->languageRepository->findMainLanguage()->getCode();

        $itemListElement = [];
        foreach ($materials as $key => $material) {
            $itemListElement[] = [
                '@type' => 'ListItem',
                'position' => $key + 1,
                'name' => $material->getTitle(),
                'url' => $this->urlGenerator->generate('material_page', ['token' => $material->getToken()]),
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
                    'name' => $this->t('Published Materials'),
                    'description' => $this->t('Browse published materials secured and verified via blockchain'),
                    'isPartOf' => [
                        '@id' => $this->organizationDomain() . '#website',
                    ],
                    'mainEntity' => [
                        '@id' => '#materials-list',
                    ],
                    'inLanguage' => $this->currentLocale(),
                ],
                [
                    '@type' => 'ItemList',
                    '@id' => '#materials-list',
                    'name' => $this->t('Published Materials'),
                    'itemListOrder' => $this->schemaOrg('ItemListOrderDescending'),
                    'numberOfItems' => count($materials),
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
}
