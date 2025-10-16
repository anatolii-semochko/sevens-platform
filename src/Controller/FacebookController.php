<?php

declare(strict_types=1);

namespace App\Controller;

use App\Security\LoginFormAuthenticator;
use App\Service\Auth\FacebookAuthService;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use KnpU\OAuth2ClientBundle\Exception\InvalidStateException;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Authentication\UserAuthenticatorInterface;

class FacebookController extends AbstractController
{
    public function __construct(
        private readonly FacebookAuthService $facebookAuthService,
    ) {}

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
        UserAuthenticatorInterface $userAuthenticator,
        LoginFormAuthenticator $authenticator
    ): Response {
        $client = $clientRegistry->getClient('facebook');

        try {
            if ($request->query->get('error')) {
                $this->addFlash('error', 'Facebook authorization was denied.');
                return $this->redirectToRoute('app_login');
            }

            if (!$request->query->get('code')) {
                $this->addFlash('error', 'Missing authorization code from Facebook.');
                return $this->redirectToRoute('app_login');
            }

            $facebookUser = $client->fetchUser();
            $user = $this->facebookAuthService->findOrCreateUser($facebookUser);

            $userAuthenticator->authenticateUser(
                $user,
                $authenticator,
                $request
            );

            $this->addFlash('success', 'Successfully logged in with Facebook!');

            $userUrl = $this->generateUrl('user_index');

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

        } catch (InvalidStateException | IdentityProviderException $e) {
            $this->addFlash('error', 'Facebook authentication failed. Please try again.');
            return $this->redirectToRoute('app_login');
        } catch (\Exception $e) {
            $this->addFlash('error', 'An error occurred during authentication. Please try again.');
            return $this->redirectToRoute('app_login');
        }
    }
}