<?php

declare(strict_types=1);

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractController
{
    /**
     * This endpoint is handled by the json_login authenticator in security.yaml
     * The authenticator intercepts the request, validates credentials, and creates the session
     * This controller method is only called on successful authentication
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // If we get here, authentication was successful
        $user = $this->getUser();

        return $this->json([
            'success' => true,
            'user' => $user,
        ], context: ['groups' => ['user:read']]);
    }
}
