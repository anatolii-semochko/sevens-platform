<?php

declare(strict_types=1);

namespace App\Service\Auth;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use League\OAuth2\Client\Provider\FacebookUser;

readonly class FacebookAuthService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
    ) {}

    /**
     * Find or create a user based on Facebook OAuth data
     */
    public function findOrCreateUser(FacebookUser $facebookUser): User
    {
        $user = $this->userRepository->findByFacebookIdOrEmail(
            $facebookUser->getId(),
            $facebookUser->getEmail()
        );

        if ($user) {
            $this->updateExistingUser($user, $facebookUser);
            return $user;
        }

        return $this->createNewUser($facebookUser);
    }

    /**
     * Create a new user from Facebook data
     */
    private function createNewUser(FacebookUser $facebookUser): User
    {
        $user = new User();
        $user->setFacebookId($facebookUser->getId());
        $user->setEmail($facebookUser->getEmail());
        $user->setFirstName($facebookUser->getFirstName());
        $user->setLastName($facebookUser->getLastName());
        $user->setIsVerified(true);
        $user->setRoles(['ROLE_USER']);

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    /**
     * Update existing user with Facebook data if needed
     */
    private function updateExistingUser(User $user, FacebookUser $facebookUser): void
    {
        $needsFlush = false;

        if (!$user->getFacebookId()) {
            $user->setFacebookId($facebookUser->getId());
            $needsFlush = true;
        }

        if (!$user->getFirstName()) {
            $user->setFirstName($facebookUser->getFirstName());
            $needsFlush = true;
        }

        if (!$user->getLastName()) {
            $user->setLastName($facebookUser->getLastName());
            $needsFlush = true;
        }

        $user->setLastLogin(new \DateTimeImmutable());
        $needsFlush = true;

        if ($needsFlush) {
            $this->em->flush();
        }
    }
}