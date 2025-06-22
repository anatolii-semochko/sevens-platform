<?php

namespace App\EventListener;

use App\Service\LanguagesService;
use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class LocaleInitializerListener
{
    public function __construct(
        private LanguagesService $languagesService,
        private LocaleStorage $localeStorage,
    ) {}

    public function onKernelRequest(RequestEvent $event): void
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
}
