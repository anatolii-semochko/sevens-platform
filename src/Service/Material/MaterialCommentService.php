<?php

namespace App\Service\Material;

use App\Entity\Material\MaterialComment;
use App\Entity\User;
use App\Repository\Material\MaterialCommentRepository;

use App\Repository\Material\MaterialRepository;

readonly class MaterialCommentService
{
    public function __construct(
        private MaterialCommentRepository $commentRepository,
        private MaterialRepository $materialRepository,
    ) {}

    /**
     * Get all comments for a material
     *
     * @return MaterialComment[]
     */
    public function getCommentsByMaterialToken(string $token): array
    {
        return $this->commentRepository->findByMaterialToken($token);
    }

    /**
     * Get comments with their replies organized hierarchically
     *
     * @return array Array of top-level comments with their replies
     */
    public function getCommentsWithReplies(string $token): array
    {
        $topLevelComments = $this->commentRepository->findTopLevelCommentsByMaterialToken($token);
        $result = [];

        foreach ($topLevelComments as $comment) {
            $replies = $this->commentRepository->findRepliesByParentId($comment->getId());
            $result[] = [
                'comment' => $comment,
                'replies' => $replies,
            ];
        }

        return $result;
    }

    /**
     * Validate comment data
     *
     * @throws \InvalidArgumentException if validation fails
     */
    public function validateCommentData(array $data, ?User $user, ?int $parentCommentId = null): void
    {
        if (empty($data['comment'])) {
            throw new \InvalidArgumentException('Comment is required');
        }

        // For anonymous users, require name and email
        if (!$user && (empty($data['name']) || empty($data['email']))) {
            throw new \InvalidArgumentException('Name and email are required for anonymous comments');
        }

        // Validate parent comment if provided
        if ($parentCommentId !== null) {
            $parentComment = $this->commentRepository->find($parentCommentId);

            if (!$parentComment) {
                throw new \InvalidArgumentException('Parent comment not found');
            }

            // Prevent nested replies (replies to replies)
            if ($parentComment->getParent() !== null) {
                throw new \InvalidArgumentException('Cannot reply to a reply. Only one level of replies is allowed');
            }
        }
    }

    /**
     * Create a new comment
     */
    public function createComment(
        string $token,
        array $data,
        ?User $user,
        string $ipAddress,
        ?int $parentCommentId = null
    ): MaterialComment {
        $comment = new MaterialComment();
        $comment->setMaterialToken($token);
        $comment->setUser($user);

        if (!$user) {
            $comment->setName(trim($data['name']));
            $comment->setEmail(trim($data['email']));
        }

        $comment->setComment(trim($data['comment']));
        $comment->setIpAddress($ipAddress);

        // Set parent comment if provided
        if ($parentCommentId !== null) {
            $parentComment = $this->commentRepository->find($parentCommentId);
            $comment->setParent($parentComment);
        }

        $this->commentRepository->save($comment);

        return $comment;
    }

    /**
     * Get all comments for materials owned by a specific user
     *
     * @param string $userId
     * @return array Array of ['comment' => MaterialComment, 'material' => Material, 'replies' => MaterialComment[]]
     */
    public function getCommentsByUserMaterials(string $userId): array
    {
        // Get all materials owned by this user
        $materials = $this->materialRepository->getMaterialsByUser($userId);

        // Get all comments with replies for each material
        $allComments = [];
        foreach ($materials as $material) {
            $commentsWithReplies = $this->getCommentsWithReplies($material->getToken());

            foreach ($commentsWithReplies as $item) {
                $allComments[] = [
                    'comment' => $item['comment'],
                    'material' => $material,
                    'replies' => $item['replies'],
                ];
            }
        }

        // Sort by date (newest first)
        usort($allComments, function($a, $b) {
            return $b['comment']->getCreatedAt() <=> $a['comment']->getCreatedAt();
        });

        return $allComments;
    }
}