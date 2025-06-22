<?php

namespace App\Controller;

use App\Service\Material\MaterialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

class TestController extends AbstractController
{
    public function __construct(
        private MaterialService $materialService,
    ) {}
    
    #[Route('/test/test', name: 'api_test', methods: ['GET'])]
    public function test(): Response
    {
        
//        $this->materialService->import();
        
        
        return $this->render('base.html.twig', [
            'some_variable' => 'Platform Success!',
        ]);
    }
}
