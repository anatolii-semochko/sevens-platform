<?php

namespace App\Service\PageContent\SeoLd;

use App\Service\LocaleStorage;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class SeoLdToken extends SeoLd
{
    public function __construct(
        private RequestStack $requestStack,
        private LocaleStorage $localeStorage,
        private TranslatorInterface $translator,
    ) {
        parent::__construct($this->requestStack, $this->localeStorage, $this->translator);
    }

    public function getCreatePrivateToken(): array
    {
        // Сторінка для створення токен контейнру з даними і мінту приватного токену в блокчейні (не публікується)
        return [
            '@context' => $this->schemaOrg(),
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => $this->organizationDomain() . '#website',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'description' => $this->organizationDescription(),
                    'publisher' => [
                        '@id' => $this->organizationDomain() . '#organization',
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain() . '#organization',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ],
                [
                    '@type' => 'WebPage',
                    '@id' => $this->currentPageUrl(),
                    'url' => $this->currentPageUrl(),
                    'name' => $this->t('Create Private Token'),
                    'description' => $this->t('Create a private blockchain token and secure data container without publishing your files publicly'),
                    'isPartOf' => [
                        '@id' => $this->organizationDomain() . '#website',
                    ],
                    'mainEntity' => [
                        '@id' => '#how-to-create-private-token',
                    ],
                    'inLanguage' => $this->currentLocale(),
                ],
                [
                    '@type' => 'HowTo',
                    '@id' => '#how-to-create-private-token',
                    'name' => $this->t('How to Create a Private Token'),
                    'description' => $this->t('Step-by-step guide to creating a private blockchain token and data container that only you can access'),
                    'step' => [
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Prepare your files'),
                            'text' => $this->t('Select the digital files you want to secure with a blockchain token'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Create data container'),
                            'text' => $this->t('Your files will be packaged into a secure container on your device - they will not be sent anywhere'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Mint blockchain token'),
                            'text' => $this->t('A unique token will be minted on the blockchain to prove ownership of your data'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Store securely'),
                            'text' => $this->t('Keep both the file container and the token private key safe - they are required together to prove ownership'),
                        ],
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain() . '#organization',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ]
            ]
        ];
    }

    public function getCreateTokenMaterial(): array
    {
        // Сторінка для створення токен контейнру з даними, мінту токену в блокчейні і публікації на платформі
        return [
            '@context' => $this->schemaOrg(),
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => $this->organizationDomain() . '#website',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'description' => $this->organizationDescription(),
                    'publisher' => [
                        '@id' => $this->organizationDomain() . '#organization',
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain() . '#organization',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ],
                [
                    '@type' => 'WebPage',
                    '@id' => $this->currentPageUrl(),
                    'url' => $this->currentPageUrl(),
                    'name' => $this->t('Create Token And Publish Material'),
                    'description' => $this->t('Create a blockchain token and publish your digital materials publicly while retaining proof of intellectual property rights'),
                    'isPartOf' => [
                        '@id' => $this->organizationDomain() . '#website',
                    ],
                    'mainEntity' => [
                        '@id' => '#how-to-create-token-and-publish',
                    ],
                    'inLanguage' => $this->currentLocale(),
                ],
                [
                    '@type' => 'HowTo',
                    '@id' => '#how-to-create-token-and-publish',
                    'name' => $this->t('How to Create Token and Publish Material'),
                    'description' => $this->t('Step-by-step guide to creating a blockchain token and publishing your materials with proof of ownership'),
                    'step' => [
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Prepare your files'),
                            'text' => $this->t('Select the digital files you want to publish and secure with a blockchain token'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Create data container'),
                            'text' => $this->t('Your files will be packaged into a container that will be published publicly'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Mint blockchain token'),
                            'text' => $this->t('A unique token will be minted on the blockchain to prove your intellectual property rights'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Publish material'),
                            'text' => $this->t('Your material will be published on the platform and accessible to everyone'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Store securely'),
                            'text' => $this->t('Keep the file container and token private key safe - they prove your ownership rights'),
                        ],
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain(),
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ]
            ]
        ];
    }

    public function getCreateMaterialFromToken(): array
    {
        // Сторінка публікації на платформі на базі створеного раніше токену
        return [
            '@context' => $this->schemaOrg(),
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => $this->organizationDomain() . '#website',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'description' => $this->organizationDescription(),
                    'publisher' => [
                        '@id' => $this->organizationDomain() . '#organization',
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain() . '#organization',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ],
                [
                    '@type' => 'WebPage',
                    '@id' => $this->currentPageUrl(),
                    'url' => $this->currentPageUrl(),
                    'name' => $this->t('Publish Material From Your Token'),
                    'description' => $this->t('Publish your digital materials from an existing blockchain token and data container without additional blockchain transactions'),
                    'isPartOf' => [
                        '@id' => $this->organizationDomain() . '#website',
                    ],
                    'mainEntity' => [
                        '@id' => '#how-to-publish-from-token',
                    ],
                    'inLanguage' => $this->currentLocale(),
                ],
                [
                    '@type' => 'HowTo',
                    '@id' => '#how-to-publish-from-token',
                    'name' => $this->t('How to Publish Material From Existing Token'),
                    'description' => $this->t('Step-by-step guide to publishing materials from your previously created blockchain token'),
                    'step' => [
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Prepare token container'),
                            'text' => $this->t('Load your previously created token container with the files you want to publish'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Verify ownership'),
                            'text' => $this->t('Sign a message with your wallet to prove you are the owner of the token'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Publish material'),
                            'text' => $this->t('Your material will be published on the platform without spending coins or creating blockchain transactions'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Store securely'),
                            'text' => $this->t('Continue to keep your file container and token private key safe as proof of ownership'),
                        ],
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain(),
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ]
            ]
        ];
    }

    public function getCheckToken(): array
    {
        // Сторінка перевірки наявності і валідності токену в блокчейні для контейнера з даними
        return [
            '@context' => $this->schemaOrg(),
            '@graph' => [
                [
                    '@type' => 'WebSite',
                    '@id' => $this->organizationDomain() . '#website',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'description' => $this->organizationDescription(),
                    'publisher' => [
                        '@id' => $this->organizationDomain() . '#organization',
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain() . '#organization',
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ],
                [
                    '@type' => 'WebPage',
                    '@id' => $this->currentPageUrl(),
                    'url' => $this->currentPageUrl(),
                    'name' => $this->t('Check Your Token Container'),
                    'description' => $this->t('Verify the validity and blockchain presence of your token container securely on your device'),
                    'isPartOf' => [
                        '@id' => $this->organizationDomain() . '#website',
                    ],
                    'mainEntity' => [
                        '@id' => '#how-to-check-token',
                    ],
                    'inLanguage' => $this->currentLocale(),
                ],
                [
                    '@type' => 'HowTo',
                    '@id' => '#how-to-check-token',
                    'name' => $this->t('How to Check Token Container'),
                    'description' => $this->t('Step-by-step guide to verifying your token container validity and blockchain presence'),
                    'step' => [
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Load token container'),
                            'text' => $this->t('Select your token container file for verification'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Verify locally'),
                            'text' => $this->t('The container will be verified on your device - no data will be sent anywhere'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('Check blockchain'),
                            'text' => $this->t('The system will verify that the corresponding token exists in the blockchain'),
                        ],
                        [
                            '@type' => 'HowToStep',
                            'name' => $this->t('View results'),
                            'text' => $this->t('See the validation results and blockchain status of your token'),
                        ],
                    ],
                ],
                [
                    '@type' => 'Organization',
                    '@id' => $this->organizationDomain(),
                    'name' => $this->organizationName(),
                    'url' => $this->organizationDomain(),
                    'logo' => [
                        '@type' => 'ImageObject',
                        'url' => $this->organizationLogo(),
                    ]
                ]
            ]
        ];
    }
}
