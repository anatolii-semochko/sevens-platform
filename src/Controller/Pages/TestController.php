<?php

namespace App\Controller\Pages;

use App\Service\Material\MaterialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class TestController extends AbstractController
{
    public function __construct(
        private MaterialService $materialService,
    ) {}

    #[Route('/test/test', name: 'api_test', methods: ['GET'])]
    public function test(): Response
    {

        // Тимчасовий імпорт матеріалів
        // $this->materialService->import();

        // Генерація URL з урахуванням мови
        // <a href="{{ path('main_page', {'_locale': app.request.locale}) }}">Home</a>
        // $this->generateUrl('main_page', ['_locale' => $request->getLocale()])

        // Генерація HelpContent
        // $this->helpService->generate();

        return $this->render('base.html.twig', [
            'some_variable' => 'Platform Success!',
        ]);
    }
}
