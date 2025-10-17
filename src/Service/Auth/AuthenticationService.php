<?php

declare(strict_types=1);

namespace App\Service\Auth;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\LoginFormAuthenticator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\UserAuthenticatorInterface;

readonly class AuthenticationService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private UserAuthenticatorInterface $userAuthenticator,
        private LoginFormAuthenticator $loginFormAuthenticator,
    ) {}

    /**
     * Authenticate user with email and password
     *
     * @throws AuthenticationException If credentials are invalid
     */
    public function authenticateUser(string $email, string $password, Request $request): User
    {
        // Find user by email
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            throw new AuthenticationException('Invalid credentials');
        }

        // Verify password
        if (!$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new AuthenticationException('Invalid credentials');
        }

        // Check if user is verified
        if (!$user->isVerified()) {
            throw new AuthenticationException('Please verify your email address');
        }

        // Authenticate the user in the session
        $this->userAuthenticator->authenticateUser(
            $user,
            $this->loginFormAuthenticator,
            $request
        );

        return $user;
    }
}