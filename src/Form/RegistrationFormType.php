<?php

declare(strict_types=1);

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\IsTrue;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\PasswordStrength;

class RegistrationFormType extends AbstractType
{
    // Password configuration - change this to adjust requirements
    private const PASSWORD_MIN_LENGTH = 8;
    private const PASSWORD_STRENGTH_LEVEL = PasswordStrength::STRENGTH_WEAK;
    // Set to true to disable strength check (development only)
    private const DISABLE_STRENGTH_CHECK = true;

    /**
     * Get human-readable password requirements based on current strength level
     * Note: Symfony's PasswordStrength uses entropy-based validation (randomness/complexity)
     * rather than specific character requirements
     */
    private function getPasswordRequirements(): string
    {
        return match (self::PASSWORD_STRENGTH_LEVEL) {
            PasswordStrength::STRENGTH_WEAK => 'sufficient variety of characters (avoid simple patterns like "aaaaaaaa" or "12345678")',
            PasswordStrength::STRENGTH_MEDIUM => 'good variety of different characters (mix of letters, numbers, and symbols recommended)',
            PasswordStrength::STRENGTH_STRONG => 'strong variety and randomness (avoid common words and patterns)',
            PasswordStrength::STRENGTH_VERY_STRONG => 'very high randomness and complexity',
            default => 'a mix of different character types',
        };
    }

    /**
     * Get password hint message for the form
     */
    private function getPasswordHint(): string
    {
        if (self::DISABLE_STRENGTH_CHECK) {
            return sprintf('Must be at least %d characters.', self::PASSWORD_MIN_LENGTH);
        }

        return sprintf(
            'Must be at least %d characters with %s.',
            self::PASSWORD_MIN_LENGTH,
            $this->getPasswordRequirements()
        );
    }

    /**
     * Get password constraints array
     */
    private function getPasswordConstraints(): array
    {
        $constraints = [
            new NotBlank([
                'message' => 'Please enter a password',
            ]),
            new Length([
                'min' => self::PASSWORD_MIN_LENGTH,
                'minMessage' => 'Your password should be at least {{ limit }} characters',
                'max' => 4096,
            ]),
        ];

        if (!self::DISABLE_STRENGTH_CHECK) {
            $constraints[] = new PasswordStrength([
                'minScore' => self::PASSWORD_STRENGTH_LEVEL,
                'message' => $this->getPasswordErrorMessage(),
            ]);
        }

        return $constraints;
    }

    /**
     * Get password error message
     */
    private function getPasswordErrorMessage(): string
    {
        return sprintf(
            'Your password is too weak. It must contain: %s.',
            $this->getPasswordRequirements()
        );
    }

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('email', EmailType::class, [
                'attr' => [
                    'autocomplete' => 'email',
                    'placeholder' => 'your@email.com',
                ],
                'constraints' => [
                    new NotBlank([
                        'message' => 'Please enter your email address',
                    ]),
                    new Email([
                        'message' => 'Please enter a valid email address',
                    ]),
                ],
            ])
            ->add('plainPassword', RepeatedType::class, [
                'type' => PasswordType::class,
                'mapped' => false,
                'first_options' => [
                    'label' => 'Password',
                    'attr' => [
                        'autocomplete' => 'new-password',
                        'placeholder' => 'Enter your password',
                    ],
                    'help' => $this->getPasswordHint(),
                    'help_attr' => ['class' => 'form-text text-muted'],
                ],
                'second_options' => [
                    'label' => 'Confirm Password',
                    'attr' => [
                        'autocomplete' => 'new-password',
                        'placeholder' => 'Confirm your password',
                    ],
                ],
                'invalid_message' => 'The password fields must match.',
                'constraints' => $this->getPasswordConstraints(),
            ])
            ->add('agreeTerms', CheckboxType::class, [
                'mapped' => false,
                'constraints' => [
                    new IsTrue([
                        'message' => 'You must agree to our terms and conditions.',
                    ]),
                ],
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}
