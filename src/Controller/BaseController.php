<?php

namespace App\Controller;
use App\Entity\User;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Security\Http\Util\TargetPathTrait;

class BaseController extends AbstractController
{
    use TargetPathTrait;
    public function page404(
        PageService $pageService,
        MaterialService $materialService,
    ): Response {
        $pageService->init('/404');
        return new Response($this->renderView('base.html.twig', [
            'main_template' => 'pages/404.html.twig',
            'data' => [
                'materials' => $materialService->getHighestRated(50),
            ],
        ]), Response::HTTP_NOT_FOUND);
    }

    public function requireAuth(Request $request): ?Response
    {
        $user = $this->getUser();
        if (!$user || !$user->getId()) {
            $this->saveTargetPath($request->getSession(), 'main', $request->getUri());

            return $this->redirectToRoute('app_login', [
                '_locale' => $request->getLocale()
            ]);
        }

        return null;
    }

    public function checkAuthorizationAjax(?string $userId = null): void
    {
        $user = $this->getUser();
        if (!$user || !$user->getId()) {
            throw new AccessDeniedHttpException('User not authorized');
        }
        if (!$user->isVerified()) {
            throw new AccessDeniedHttpException('User is not verified');
        }
        if ($userId && $userId !== $user->getId()) {
            throw new AccessDeniedHttpException('User not authorized for this operation');
        }
    }
}
