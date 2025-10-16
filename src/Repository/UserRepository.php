<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use App\Exception\NotFoundException;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function get(string $id): User
    {
        $user = $this->find($id);
        if (!$user instanceof User) {
            throw new NotFoundException('User not found');
        }

        return $user;
    }

    public function findByFacebookId(string $facebookId): ?User
    {
        return $this->findOneBy(['facebookId' => $facebookId]);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => $email]);
    }

    public function findByFacebookIdOrEmail(string $facebookId, string $email): ?User
    {
        $user = $this->findByFacebookId($facebookId);

        if (!$user) {
            $user = $this->findByEmail($email);
        }

        return $user;
    }
}