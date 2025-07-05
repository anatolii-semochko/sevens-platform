<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/test', name: 'api_test_', methods: ['GET'])]
class TestApiController extends BaseController
{
    private const array HELP_GROUPS = ['groups' => ['help:read', 'help-content:read', 'language:read']];

    public function __construct(
    ) {}

    #[Route('', name: 'test', methods: ['GET'])]
    public function get(Request $request): JsonResponse
    {
        try {
            $test = [
                'test' => 'hello world',
                'request' => $request->query->all(),
            ];
        } catch (\Exception $e) {
            throw new BadRequestException($e->getMessage(), $e->getCode(), $e);
        }

        return $this->json($test);
    }
}
