<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class FacebookController extends AbstractController
{
    #[Route('/connect/facebook', name: 'connect_facebook_start')]
    public function connectAction(ClientRegistry $clientRegistry): RedirectResponse
    {
        return $clientRegistry
            ->getClient('facebook')
            ->redirect([
                'email', 'public_profile'
            ], []);
    }

    #[Route('/connect/facebook/check', name: 'connect_facebook_check')]
    public function connectCheckAction(
        Request $request,
        ClientRegistry $clientRegistry,
        EntityManagerInterface $entityManager,
        TokenStorageInterface $tokenStorage
    ): Response {
        $client = $clientRegistry->getClient('facebook');

        try {
            $facebookUser = $client->fetchUser();

            $existingUser = $entityManager->getRepository(User::class)->findOneBy([
                'facebookId' => $facebookUser->getId()
            ]);

            if (!$existingUser) {
                $existingUser = $entityManager->getRepository(User::class)->findOneBy([
                    'email' => $facebookUser->getEmail()
                ]);
            }

            if (!$existingUser) {
                $existingUser = new User();
                $existingUser->setFacebookId($facebookUser->getId());
                $existingUser->setEmail($facebookUser->getEmail());
                $existingUser->setFirstName($facebookUser->getFirstName());
                $existingUser->setLastName($facebookUser->getLastName());
                $existingUser->setIsVerified(true);
                $existingUser->setRoles(['ROLE_USER']);

                $entityManager->persist($existingUser);
                $entityManager->flush();
            } else {
                if (!$existingUser->getFacebookId()) {
                    $existingUser->setFacebookId($facebookUser->getId());
                }
                if (!$existingUser->getFirstName()) {
                    $existingUser->setFirstName($facebookUser->getFirstName());
                }
                if (!$existingUser->getLastName()) {
                    $existingUser->setLastName($facebookUser->getLastName());
                }
                $existingUser->setLastLogin(new \DateTimeImmutable());

                $entityManager->flush();
            }

            $token = new UsernamePasswordToken($existingUser, 'main', $existingUser->getRoles());
            $tokenStorage->setToken($token);

            $this->addFlash('success', 'Successfully logged in with Facebook!');
            return $this->redirectToRoute('user_index');

        } catch (IdentityProviderException $e) {
            $this->addFlash('error', 'Authentication failed. Please try again.');
            return $this->redirectToRoute('app_login');
        }
    }
}