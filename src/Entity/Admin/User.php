<?php

namespace App\Entity\Admin;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Serializer\Annotation\Groups;
use DateTimeImmutable;

#[ORM\Entity]
#[ORM\Table(name: 'admin_users')]
class User
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['user:read'])]
    private string $id;

    #[ORM\Column(type: 'string', length: 32, unique: true)]
    #[Groups(['user:read'])]
    private string $userName;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    #[Assert\NotBlank(message: 'Email is required.')]
    #[Assert\Email(message: 'Please enter a valid email address.', mode: 'strict')]
    #[Groups(['user:read'])]
    private string $email;

    #[ORM\Column(type: 'string', length: 64)]
    private string $passwordHash;

    #[ORM\Column(type: 'string', length: 64)]
    #[Groups(['user:read'])]
    private string $fullName;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['user:read'])]
    private bool $active = true;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $avatar = null;

    #[ORM\Column(type: 'json')]
    #[Groups(['user:read'])]
    private array $roles = [];

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['user:read'])]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['user:read'])]
    private ?DateTimeImmutable $lastActivityAt = null;

    #[ORM\Column(type: 'boolean')]
    private bool $authorized = true;
}
