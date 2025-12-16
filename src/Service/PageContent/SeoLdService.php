<?php

namespace App\Service\PageContent;

use App\Service\LocaleStorage;
use App\Service\PageContent\SeoLd\SeoLdHelp;
use App\Service\PageContent\SeoLd\SeoLdMain;
use App\Service\PageContent\SeoLd\SeoLdMaterial;
use App\Service\PageContent\SeoLd\SeoLdToken;
use Exception;

readonly class SeoLdService
{
    public function __construct(
        private LocaleStorage $localeStorage,
        private SeoLdMain $seoLdMain,
        private SeoLdHelp $seoLdHelp,
        private SeoLdToken $seoLdToken,
        private SeoLdMaterial $seoLdMaterial,
    ) {}

    /**
     * @throws Exception
     */
    private function getLd(string $pageUrl, array $params): ?array
    {
        return match ($pageUrl) {
            '/' => $this->seoLdMain->getMainPage($params),
            '/help' => $this->seoLdHelp->getHelpMainPage($params),
            '/help/page' => $this->seoLdHelp->getHelpSubPage($params),
            '/create-private-token' => $this->seoLdToken->getCreatePrivateToken(),
            '/create-token-material' => $this->seoLdToken->getCreateTokenMaterial(),
            '/create-material-from-token' => $this->seoLdToken->getCreateMaterialFromToken(),
            '/check-token' => $this->seoLdToken->getCheckToken(),
            '/material' => $this->seoLdMaterial->getMaterialPage($params),
            default => null,
        };
    }

    /**
     * @throws Exception
     */
    public function get(): ?string
    {
        $page = $this->localeStorage->getPage();
        $params = $this->localeStorage->getSeoLdParams();
        $seoLdData = $this->getLd($page->getUrl(), $params);

        return $seoLdData
            ? json_encode($seoLdData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            : null;
    }
}
