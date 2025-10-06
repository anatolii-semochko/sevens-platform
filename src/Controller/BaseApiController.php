<?php

namespace App\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Security\Http\Util\TargetPathTrait;

class BaseApiController extends AbstractController
{
    use TargetPathTrait;

    public function checkAuthorization(?string $userId = null): void
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
