<?php

namespace App\Controller;
use App\Entity\User;
use App\Service\Material\MaterialService;
use App\Service\PageContent\PageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class BaseController extends AbstractController
{
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

    public function checkAuthorization(?User $user, ?string $userId = null): void
    {
        if (!$user || !$user->getId()) {
            // TODO - Add redirect to authorization page
            throw new AccessDeniedHttpException('User not authorized');
        }
        if ($userId && $userId !== $user->getId()) {
            throw new AccessDeniedHttpException('User not authorized');
        }
    }
}
