<?php

namespace App\Service\PageContent\SeoLd;

use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class SeoLd
{
    public function __construct(
        private RequestStack $requestStack,
        private LocaleStorage $localeStorage,
        private TranslatorInterface $translator,
    ) {}

    public const string TRANSLATIONS_DOMAIN = 'ld-json';
    public const string SCHEMA_ORG = 'https://schema.org';

    public function currentPageUrl(): string
    {
        return $this->requestStack->getCurrentRequest()->getUri();
    }

    public function currentLocale(): string
    {
        return $this->localeStorage->getLocale();
    }

    public function organizationName(): string
    {
        return $_ENV['ORGANIZATION'];
    }

    public function organizationDescription(): string
    {
        return $this->t('Proof of authenticity of digital data and intellectual ownership via blockchain records');
    }

    public function organizationDomain(): string
    {
        return $_ENV['DOMAIN'];
    }

    public function organizationLogo(): string
    {
        return $_ENV['LOGO'];
    }

    public function schemaOrg(?string $link = null): string
    {
        return self::SCHEMA_ORG . ($link ? "/$link" : '');
    }

    public function nftCollectionName(): string
    {
        return $_ENV['COLLECTION_NAME'] . ' NFT Collection';
    }

    public function nftCollectionIpfsJsonUrl(): string
    {
        return $_ENV['COLLECTION_IPFS_JSON'];
    }

    public function nftCollectionBlockchainUrl(): string
    {
        return $_ENV['COLLECTION_URL'];
    }

    public function t(string $text, array $params = []): string
    {
        return $this->translator->trans($text, $params, self::TRANSLATIONS_DOMAIN);
    }
}
