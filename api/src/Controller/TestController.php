<?php

namespace App\Controller;

use App\Repository\TestRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class TestController extends AbstractController
{
    #[Route('/test/test', name: 'api_test', methods: ['GET'])]
    public function test(TestRepository $testRepository): JsonResponse
    {
        $tests = $testRepository->findAll();

        return $this->json(
            [
                'test' => 'Platform Success !',
                'data' => $tests,
            ],
            200,
            [],
            ['groups' => ['test:read']]
        );
        
        
//        return $this->json([
//            'test' => 'Platform Success !',
//            'data' => $testRepository->findAll(),
//        ]);
    }
}
