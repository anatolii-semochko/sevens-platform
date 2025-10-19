<?php

namespace App\Service\Material;

use App\Entity\Material\MaterialVote;
use App\Entity\User;
use App\Repository\Material\MaterialVoteRepository;

readonly class MaterialVoteService
{
    public function __construct(
        private MaterialVoteRepository $voteRepository,
    ) {}

    /**
     * Process a vote (create, update, or toggle off)
     *
     * @param string $token Material token
     * @param string $voteType 'like' or 'dislike'
     * @param User|null $user Logged in user or null for anonymous
     * @param string|null $sessionId Session ID for anonymous users
     * @param string $ipAddress IP address of the voter
     * @return void
     */
    public function processVote(
        string $token,
        string $voteType,
        ?User $user,
        ?string $sessionId,
        string $ipAddress
    ): void {
        $existingVote = $this->voteRepository->findExistingVote($token, $user, $sessionId);

        if ($existingVote) {
            if ($existingVote->getVoteType() === $voteType) {
                // Same vote - remove it (toggle off)
                $this->voteRepository->delete($existingVote);
            } else {
                // Different vote - update it
                $existingVote->setVoteType($voteType);
                $this->voteRepository->save($existingVote);
            }
        } else {
            // New vote
            $vote = new MaterialVote();
            $vote->setMaterialToken($token);
            $vote->setUser($user);
            $vote->setSessionId($sessionId);
            $vote->setIpAddress($ipAddress);
            $vote->setVoteType($voteType);
            $this->voteRepository->save($vote);
        }
    }

    /**
     * Get vote counts for a material
     *
     * @return array{likeCount: int, dislikeCount: int}
     */
    public function getVoteCounts(string $token): array
    {
        return [
            'likeCount' => $this->voteRepository->countLikes($token),
            'dislikeCount' => $this->voteRepository->countDislikes($token),
        ];
    }
}
