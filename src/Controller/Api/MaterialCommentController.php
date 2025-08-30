<?php

namespace App\Controller\Api;

use App\Entity\Material\MaterialComment;
use App\Repository\Material\MaterialCommentRepository;
use App\Repository\Material\MaterialRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/material', name: 'api_material_comment_')]
class MaterialCommentController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MaterialRepository $materialRepository,
        private readonly MaterialCommentRepository $commentRepository,
    ) {}

    #[Route('/{token}/comments', name: 'list', methods: ['GET'])]
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

    #[Route('/{token}/comments', name: 'create', methods: ['POST'])]
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