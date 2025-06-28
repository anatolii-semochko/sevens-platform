<?php

namespace App\EventListener;

use App\Service\LanguagesService;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class PageInitializerListener
{
    public function __construct(
        private LocaleStorage $localeStorage,
        private LanguagesService $languagesService,
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {    
        $this->initLocale($event);
        $this->initLanguage();
        $this->initUrl($event);
    }

    /**
     * Locale Validator and Initializer. Redirects to URL with Locale.
     */
    private function initLocale(RequestEvent $event): void
    {
        $locale = $event->getRequest()->getLocale();
        $allowedLocales = $this->languagesService->fetchLocales();
        
        if (!$locale || !in_array($locale, $allowedLocales)) {
            $event->setResponse(new RedirectResponse(
                '/' . $this->languagesService->getMainLanguage()->getCode(),
                Response::HTTP_FOUND,
            ));
        }

        $this->localeStorage->setLocale($locale);
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
