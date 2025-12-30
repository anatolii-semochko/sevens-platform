<?php

namespace App\Service\PageContent\SeoLd;

use App\Entity\Material\Material;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class SeoLdMaterial extends SeoLd
{
    public function __construct(
        private RequestStack $requestStack,
        private LocaleStorage $localeStorage,
        private TranslatorInterface $translator,
    ) {
        parent::__construct($this->requestStack, $this->localeStorage, $this->translator);
    }

    /**
     * @throws \DateMalformedStringException
     */
    public function getMaterialPage(array $params): array
    {
        /** @var Material $material */
        $material = $params[0];
        $token = $material->getTokenData();
        $tokenAddress = $token->getTokenPublicKey();
        $solanaExplorerNft = $token->getBlockchainTokenUrl();

        // ===== TOKEN (ON-CHAIN, IMMUTABLE) =====
        $tokenImmutable = [
            '@type' => 'Product',
            '@id' => '#nft',
            'name' => $token->getName() ? "NFT {$this->t('Token')} – {$token->getName()}" : "NFT {$this->t('Token')}",
            'description' => $token->getDescription() ?: $material->getDescription(),
            'sku' => 'NFT-' . $tokenAddress,
            'category' => 'NFT / ' . $this->t('Tokenized Digital Asset'),
            'sameAs' => $solanaExplorerNft,
            'identifier' => [
                '@type' => 'PropertyValue',
                'propertyID' => 'SolanaTokenAddress',
                'value' => $tokenAddress,
            ],
            'dateCreated' => $token->getMintingTime()->format('Y-m-d'),
            'creator' => [
                '@type' => 'Person',
                'name' => $token->getAuthor() ?: $this->t('Anonymous'),
            ],
            'additionalProperty' => [
                [
                    '@type' => 'PropertyValue',
                    'propertyID' => 'DataHash',
                    'value' => 'SHA256:' . $token->getHash(),
                ],
            ],
            'isDigital' => true,
        ];

        // ===== NFT COLLECTION =====
        $collection = [
            '@type' => 'Collection',
            '@id' => '#collection',
            'name' => $this->nftCollectionName(),
            'url' => $this->nftCollectionIpfsJsonUrl(),
            'sameAs' => $this->nftCollectionBlockchainUrl(),
            'creator' => [
                '@type' => 'Organization',
                'name' => $this->organizationName(),
            ],
        ];

        // ===== MATERIAL (Publication) =====
        $publication = [
            '@type' => 'Article',
            '@id' => '#article',
            'headline' => $material->getTitle(),
            'description' => $material->getDescription(),
            'url' => $this->currentPageUrl(),
            'datePublished' => $material->getCreatedAt()->format('Y-m-d'),
            'dateModified' => $material->getUpdatedAt()->format('Y-m-d'),
            'inLanguage' => $this->currentLocale(),
            'author' => [
                '@type' => 'Person',
                'name' => $token->getAuthor() ?: $this->t('Anonymous'),
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $this->organizationName(),
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => $this->organizationLogo(),
                ],
            ],
            'isBasedOn' => [
                ['@id' => '#nft'],
                [
                    '@type' => 'CreativeWork',
                    'name' => $this->t('Solana Blockchain Record'),
                    'sameAs' => $solanaExplorerNft,
                ],
            ],
        ];

        // ===== WEBPAGE =====
        $webPage = [
            '@type' => 'WebPage',
            '@id' => $this->currentPageUrl(),
            'url' => $this->currentPageUrl(),
            'name' => $material->getTitle(),
            'description' => $material->getDescription(),
            'inLanguage' => $this->currentLocale(),
            'isPartOf' => [
                '@id' => $this->organizationDomain() . '#website',
            ],
            'mainEntity' => ['@id' => '#article'],
            'breadcrumb' => ['@id' => '#breadcrumb'],
        ];

        // ===== BREADCRUMB =====
        $breadcrumb = [
            '@type' => 'BreadcrumbList',
            '@id' => '#breadcrumb',
            'itemListElement' => [
                [
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => $this->t('Published Materials'),
                    'item' => $this->organizationDomain() . '/' . $this->currentLocale() . '/',
                ],
                [
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => $material->getTitle(),
                ],
            ],
        ];

        // ===== OFFERS (Always present, no fake 0 price) =====
        $offer = [
            '@type' => 'Offer',
            'url' => $this->currentPageUrl(),
            'availability' => $this->schemaOrg($material->getPrice() ? 'InStock' : 'OutOfStock'),
            'seller' => [
                '@type' => 'Person',
                'name' => $material->getUser()?->getFullName() ?: $this->t('Anonymous'),
            ],
        ];

        if ($material->getPrice()) {
            $offer['price'] = $material->getPrice();
            $offer['priceCurrency'] = 'SOL';
        }

        $tokenImmutable['offers'] = $offer;

        // ===== RELATIONSHIPS =====
        $tokenImmutable['isPartOf'] = ['@id' => '#collection'];

        // ===== FINAL LD GRAPH =====
        return [
            '@context' => $this->schemaOrg(),
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => $this->organizationDomain() . '#website',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'description' => $this->organizationDescription(),
                    'publisher' => [
                        '@id' => $this->organizationDomain() . '#organization',
                    ],
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
                ],
                $webPage,
                $breadcrumb,
                $publication,
                $collection,
                $tokenImmutable,
            ],
        ];
    }
}
