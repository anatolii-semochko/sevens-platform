<?php

namespace App\Controller\Api;

use App\Controller\BaseApiController;
use App\Repository\Material\MaterialRepository;
use App\Service\Material\MaterialCommentService;
use App\Service\Material\MaterialVoteService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material', name: 'api_material_comment_')]
class MaterialCommentController extends BaseApiController
{
    public function __construct(
        private readonly MaterialRepository $materialRepository,
        private readonly MaterialCommentService $commentService,
        private readonly MaterialVoteService $voteService,
    ) {}

    #[Route('/{token}/comments', name: 'comments_list', methods: ['GET'])]
    public function getComments(string $token): JsonResponse
    {
        try {
            $this->materialRepository->get($token);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Material not found'], 404);
        }

        $commentsWithReplies = $this->commentService->getCommentsWithReplies($token);

        $formatComment = fn($comment) => [
            'id' => $comment->getId(),
            'name' => $comment->getUser() ?
                $comment->getUser()->getFirstName() . ' ' . $comment->getUser()->getLastName() :
                $comment->getName(),
            'comment' => $comment->getComment(),
            'createdAt' => $comment->getCreatedAt()->format('M j, Y g:i A'),
            'isRegisteredUser' => $comment->getUser() !== null,
        ];

        return new JsonResponse([
            'comments' => array_map(fn($item) => [
                ...$formatComment($item['comment']),
                'replies' => array_map($formatComment, $item['replies']),
            ], $commentsWithReplies)
        ]);
    }

    #[Route('/{token}/comments', name: 'comment_add', methods: ['POST'])]
    public function createComment(string $token, Request $request): JsonResponse
    {
        try {
            $this->materialRepository->get($token);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Material not found'], 404);
        }

        $payload = $request->getPayload();
        $user = $this->getUser();
        $parentCommentId = $payload->getInt('parentCommentId');

        try {
            $this->commentService->validateCommentData($payload->all(), $user, $parentCommentId);
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        $comment = $this->commentService->createComment($token, $payload->all(), $user, $request->getClientIp(), $parentCommentId);

        return new JsonResponse([
            'success' => true,
            'comment' => [
                'id' => $comment->getId(),
                'name' => $comment->getUser() ?
                    $comment->getUser()->getFirstName() . ' ' . $comment->getUser()->getLastName() :
                    $comment->getName(),
                'comment' => $comment->getComment(),
                'createdAt' => $comment->getCreatedAt()->format('M j, Y g:i A'),
                'isRegisteredUser' => $comment->getUser() !== null,
                'parentId' => $comment->getParent()?->getId(),
            ]
        ], 201);
    }

    #[Route('/{token}/vote', name: 'material_vote', methods: ['POST'])]
    public function vote(string $token, Request $request): JsonResponse
    {
        $payload = $request->getPayload();
        $voteType = $payload->get('type');

        if (!in_array($voteType, ['like', 'dislike'], true)) {
            return new JsonResponse(['error' => 'Invalid vote type'], 400);
        }

        try {
            $this->materialRepository->get($token);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Material not found'], 404);
        }

        $user = $this->getUser();
        $sessionId = $user ? null : $request->getSession()->getId();
        $ipAddress = $request->getClientIp();

        $this->voteService->processVote($token, $voteType, $user, $sessionId, $ipAddress);

        return new JsonResponse($this->voteService->getVoteCounts($token));
    }
}
