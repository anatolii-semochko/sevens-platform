<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Exception\WrappedHttpException;
use App\Service\Auth\AuthenticationService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends BaseApiController
{
    public function __construct(
        private readonly AuthenticationService $authenticationService,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        try {
            $payload = $request->getPayload();
            $email = $payload->get('email');
            $password = $payload->get('password');

            $user = $this->authenticationService->authenticateUser($email, $password, $request);

            return $this->json([
                'success' => true,
                'user' => $user,
            ], context: ['groups' => ['user:read']]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }
}
