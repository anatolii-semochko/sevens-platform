<?php

namespace App\Controller\Pages\Comment;

use App\Controller\BaseController;
use App\Service\Material\MaterialCommentService;
use App\Service\PageContent\PageService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/comments', name: 'comments_')]
class CommentController extends BaseController
{
    public function __construct(
        private readonly PageService $pageService,
        private readonly MaterialCommentService $commentService,
    ) {}

    #[Route('/manage', name: 'manage', methods: ['GET'])]
    public function manage(Request $request): Response
    {
        if ($response = $this->requireAuth($request)) {
            return $response;
        }

        $user = $this->getUser();
        $commentsData = $this->commentService->getCommentsByUserMaterials($user->getId());

        // Format comments for React component
        $formatComment = fn($comment) => [
            'id' => $comment->getId(),
            'name' => $comment->getUser() ?
                $comment->getUser()->getFirstName() . ' ' . $comment->getUser()->getLastName() :
                $comment->getName(),
            'email' => $comment->getEmail(),
            'comment' => $comment->getComment(),
            'createdAt' => $comment->getCreatedAt()->format('c'), // ISO 8601 format for JavaScript
            'user' => $comment->getUser() !== null,
        ];

        $comments = array_map(function($item) use ($formatComment) {
            return [
                'comment' => $formatComment($item['comment']),
                'material' => [
                    'token' => $item['material']->getToken(),
                    'title' => $item['material']->getTitle(),
                ],
                'replies' => array_map($formatComment, $item['replies']),
            ];
        }, $commentsData);

        $this->pageService->init('/comments/manage');

        return $this->render('base.html.twig', [
            'main_template' => 'pages/comments-manage/list.html.twig',
            'data' => [
                'comments' => $comments
            ],
        ]);
    }
}