<?php

namespace App\Controller\Api;

use App\Entity\Material\MaterialComment;
use App\Entity\Material\MaterialVote;
use App\Exception\WrappedHttpException;
use App\Repository\Material\MaterialCommentRepository;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialVoteRepository;
use App\Service\Material\MaterialService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material', name: 'api_material_')]
class MaterialController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MaterialService $materialService,
        private readonly MaterialRepository $materialRepository,
        private readonly MaterialVoteRepository $voteRepository,
        private readonly MaterialCommentRepository $commentRepository,
    ) {}

    /**
     * @throws HttpException
     */
    #[Route('/create', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $payload = $request->getPayload();
            $tokenPublicKey = $payload->get('tokenPublicKey');

            // If material already exists - we return the redirect to it's page
            if ($this->materialService->finByTokenPublicKey($tokenPublicKey)) {
                return new JsonResponse([
                    'message' => 'Material for this container already exists.',
                    'link' => $this->generateUrl('material_page', ['token' => $tokenPublicKey]),
                ]);
            }

            // Create inactive material
            $this->materialService->create(
                $this->getUser(),
                $tokenPublicKey,
                $payload->get('containerFileName'),
                $payload->get('containerHash'),
                $payload->all('walletSignature'),
            );

            // And return redirect to edit and activate material page
            return new JsonResponse([
                'message' => 'Material created successfully.',
                'redirect' => $this->generateUrl('material_page', ['token' => $tokenPublicKey])
            ]);
        } catch (\Exception $e) {
            throw new WrappedHttpException($e);
        }
    }

    #[Route('/{token}/vote', name: 'material_vote', methods: ['POST'])]
    public function vote(string $token, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $voteType = $data['type'] ?? null;

        if (!in_array($voteType, ['like', 'dislike'])) {
            return new JsonResponse(['error' => 'Invalid vote type'], 400);
        }

        try {
            $material = $this->materialRepository->get($token);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Material not found'], 404);
        }

        $user = $this->getUser();
        $sessionId = $user ? null : $request->getSession()->getId();
        $ipAddress = $request->getClientIp();

        // Check for existing vote
        $existingVote = $this->voteRepository->findExistingVote($token, $user, $sessionId);

        if ($existingVote) {
            if ($existingVote->getVoteType() === $voteType) {
                // Same vote - remove it (toggle off)
                $this->em->remove($existingVote);
            } else {
                // Different vote - update it
                $existingVote->setVoteType($voteType);
            }
        } else {
            // New vote
            $vote = new MaterialVote();
            $vote->setMaterialToken($token);
            $vote->setUser($user);
            $vote->setSessionId($sessionId);
            $vote->setIpAddress($ipAddress);
            $vote->setVoteType($voteType);
            $this->em->persist($vote);
        }

        $this->em->flush();

        // Return updated counts
        return new JsonResponse([
            'likeCount' => $this->voteRepository->countLikes($token),
            'dislikeCount' => $this->voteRepository->countDislikes($token),
        ]);
    }

    #[Route('/{token}/comments', name: 'comments_list', methods: ['GET'])]
    public function getComments(string $token): JsonResponse
    {
        try {
            $this->materialRepository->get($token);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Material not found'], 404);
        }

        $comments = $this->commentRepository->findByMaterialToken($token);

        return new JsonResponse([
            'comments' => array_map(fn($comment) => [
                'id' => $comment->getId(),
                'name' => $comment->getUser() ?
                    $comment->getUser()->getFirstName() . ' ' . $comment->getUser()->getLastName() :
                    $comment->getName(),
                'comment' => $comment->getComment(),
                'createdAt' => $comment->getCreatedAt()->format('M j, Y g:i A'),
                'isRegisteredUser' => $comment->getUser() !== null,
            ], $comments)
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

        $data = json_decode($request->getContent(), true);
        $user = $this->getUser();

        if (empty($data['comment'])) {
            return new JsonResponse(['error' => 'Comment is required'], 400);
        }

        // For anonymous users, require name and email
        if (!$user && (empty($data['name']) || empty($data['email']))) {
            return new JsonResponse(['error' => 'Name and email are required for anonymous comments'], 400);
        }

        $comment = new MaterialComment();
        $comment->setMaterialToken($token);
        $comment->setUser($user);

        if (!$user) {
            $comment->setName(trim($data['name']));
            $comment->setEmail(trim($data['email']));
        }

        $comment->setComment(trim($data['comment']));
        $comment->setIpAddress($request->getClientIp());

        $this->em->persist($comment);
        $this->em->flush();

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
            ]
        ], 201);
    }
}
