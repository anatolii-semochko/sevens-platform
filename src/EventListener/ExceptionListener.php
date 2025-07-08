<?php

namespace App\EventListener;

use App\Service\PageContent\PageService;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Twig\Environment;

readonly class ExceptionListener
{
    public function __construct(
        private PageInitializerListener $pageInitializerListener,
        private PageService $pageService,
        private Environment $twig,
    ) {}

    public function onKernelException(ExceptionEvent $event): void
    {
        if ($event->getThrowable() instanceof NotFoundHttpException) {
            $this->pageInitializerListener->initLocale($event);
            $this->pageInitializerListener->initLanguage();
            $this->pageService->init('/404');
            $event->setResponse(new Response($this->twig->render('base.html.twig', [
                'main_template' => 'pages/404.html.twig',
                'data' => [],
            ]), Response::HTTP_NOT_FOUND));
        }
    }
}
