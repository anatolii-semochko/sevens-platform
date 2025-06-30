<?php

namespace App\EventListener;

use App\Service\LanguagesService;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;

readonly class PageInitializerListener
{
    public function __construct(
        private LocaleStorage $localeStorage,
        private LanguagesService $languagesService,
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$this->initLocale($event)) {
            return;
        }
        $this->initLanguage();
        $this->initUrl($event);
    }

    /**
     * Locale Validator and Initializer. Redirects to URL with Locale.
     */
    private function initLocale(RequestEvent $event): bool
    {
        preg_match('#^/([a-z]{2})/#', $event->getRequest()->getPathInfo(), $locale);
        if (empty($locale) || !in_array($locale[1], $this->languagesService->fetchLocales())) {
            $event->setResponse(new RedirectResponse(
                "/{$this->languagesService->getMainLanguage()->getCode()}/",
                Response::HTTP_FOUND,
            ));
            return false;
        }

        $this->localeStorage->setLocale($locale[1]);
        return true;
    }

    private function initLanguage(): void
    {
        $this->localeStorage->setLanguage(
            $this->languagesService->getByLocale($this->localeStorage->getLocale()),
        );
    }

    private function initUrl(RequestEvent $event): void
    {
        $path = $event->getRequest()->getPathInfo();
        if (str_starts_with($path, "/{$this->localeStorage->getLocale()}/")) {
            $this->localeStorage->settUrl(substr($path, 3));
        }
    }
}
