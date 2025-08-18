<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use KnpU\OAuth2ClientBundle\Exception\InvalidStateException;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\UserAuthenticatorInterface;
use App\Security\LoginFormAuthenticator;

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
        UserAuthenticatorInterface $userAuthenticator,
        LoginFormAuthenticator $authenticator
    ): Response {
        // Log the incoming request for debugging
        error_log('Facebook callback hit with query params: ' . json_encode($request->query->all()));
        
        $client = $clientRegistry->getClient('facebook');

        try {
            // Check if user denied authorization
            if ($request->query->get('error')) {
                error_log('Facebook error: ' . $request->query->get('error'));
                $this->addFlash('error', 'Facebook authorization was denied.');
                return $this->redirectToRoute('app_login');
            }

            // Debug: Check if we have required parameters
            $code = $request->query->get('code');
            $state = $request->query->get('state');
            
            error_log('Code: ' . ($code ? 'present' : 'missing') . ', State: ' . ($state ? 'present' : 'missing'));
            
            if (!$code) {
                error_log('Missing authorization code');
                $this->addFlash('error', 'Missing authorization code from Facebook.');
                return $this->redirectToRoute('app_login');
            }

            // Fetch user with proper error handling for state mismatch
            error_log('Attempting to fetch Facebook user');
            $facebookUser = $client->fetchUser();
            error_log('Facebook user fetched successfully: ' . $facebookUser->getId());

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

            // Use the proper authenticator to log in the user
            $userAuthenticator->authenticateUser(
                $existingUser,
                $authenticator,
                $request
            );

            // Add success message and return HTML redirect for demo
            $this->addFlash('success', 'Successfully logged in with Facebook!');
            
            $locale = $request->getLocale();
            $userUrl = "/{$locale}/user";
            
            return new Response(
                '<html><head><meta http-equiv="refresh" content="1;url=' . $userUrl . '"></head>' .
                '<body><div style="text-align:center;margin-top:50px;font-family:Arial;">' .
                '<h3>Facebook Login Successful!</h3>' .
                '<p>Redirecting to your profile...</p>' .
                '<div style="margin:20px;"><div style="display:inline-block;width:20px;height:20px;border:3px solid #f3f3f3;border-top:3px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;"></div></div>' .
                '<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>' .
                '<script>setTimeout(function(){window.location.href="' . $userUrl . '";}, 1000);</script>' .
                '</body></html>'
            );

        } catch (InvalidStateException $e) {
            error_log('InvalidStateException: ' . $e->getMessage());
            $this->addFlash('error', 'Invalid state parameter. Please try logging in again. Error: ' . $e->getMessage());
            return $this->redirectToRoute('app_login');
        } catch (IdentityProviderException $e) {
            error_log('IdentityProviderException: ' . $e->getMessage());
            $this->addFlash('error', 'Facebook authentication failed. Error: ' . $e->getMessage());
            return $this->redirectToRoute('app_login');
        } catch (\Exception $e) {
            error_log('General Exception: ' . $e->getMessage());
            $this->addFlash('error', 'An error occurred during authentication. Error: ' . $e->getMessage());
            return $this->redirectToRoute('app_login');
        }
    }
}