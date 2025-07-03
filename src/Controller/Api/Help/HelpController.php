<?php

namespace App\Controller\Api\Help;

use App\Controller\BaseController;
use App\Service\Help\HelpService;
use Symfony\Component\HttpFoundation\Exception\BadRequestException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/help', name: 'api_help_', methods: ['GET'])]
class HelpController extends BaseController
{
    private const array HELP_GROUPS = ['groups' => ['help:read', 'help-content:read', 'language:read']];

    public function __construct(
        readonly HelpService $helpService,
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function get(Request $request): JsonResponse
    {
        try {
            $help = $this->helpService->fetchByName($request->query->all('help'));
        } catch (\Exception $e) {
            throw new BadRequestException($e->getMessage(), $e->getCode(), $e);
        }

        return $this->json($help);
    }
}
