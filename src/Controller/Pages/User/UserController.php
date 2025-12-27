<?php

namespace App\Controller\Pages\User;

use App\Controller\BaseController;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/user', name: 'user_')]
class UserController extends BaseController
{
    public function __construct(
        private readonly PageService $pageService,
    ) {
    }

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        $user = $this->getUser();
        $this->pageService->init('/user');

        return $this->render('base.html.twig', [
            'main_template' => 'user/main.html.twig',
            'data' => ['user' => $user],
        ]);
    }
}
