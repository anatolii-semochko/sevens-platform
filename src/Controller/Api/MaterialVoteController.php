<?php

namespace App\Controller\Api;

use App\Entity\Material\MaterialVote;
use App\Repository\Material\MaterialRepository;
use App\Repository\Material\MaterialVoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material', name: 'api_material_')]
class MaterialVoteController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MaterialRepository $materialRepository,
        private readonly MaterialVoteRepository $voteRepository,
    ) {}

    #[Route('/{token}/vote', name: 'vote', methods: ['POST'])]
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
}