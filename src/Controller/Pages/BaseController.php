<?php

namespace App\Controller\Pages;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class BaseController extends AbstractController
{
    public function redirectPage404(): Response
    {
        return new Response($this->renderView('pages/404.html.twig'), Response::HTTP_NOT_FOUND);
    }
}
