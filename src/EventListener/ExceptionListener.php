<?php

namespace App\EventListener;

use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Twig\Environment;

class ExceptionListener
{
    public function __construct(private Environment $twig) {}

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof NotFoundHttpException) {
            $event->setResponse(new Response(
                $this->twig->render('pages/404.html.twig'),
                Response::HTTP_NOT_FOUND,
            ));
        }
    }
}
