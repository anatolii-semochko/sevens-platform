<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

class TestController extends AbstractController
{
    #[Route('/test/test', name: 'api_test', methods: ['GET'])]
    public function test(): Response
    {
        return $this->render('base.html.twig', [
            'some_variable' => 'Platform Success!',
        ]);
    }
}
