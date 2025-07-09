<?php

namespace App\Controller;
use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class BaseController extends AbstractController
{
    public function page404(PageService $pageService): Response
    {
        $pageService->init('/404');
        return new Response($this->renderView('base.html.twig', [
            'main_template' => 'pages/404.html.twig',
            'data' => [],
        ]), Response::HTTP_NOT_FOUND);
    }
}
