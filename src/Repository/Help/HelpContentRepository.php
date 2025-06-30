<?php

namespace App\Repository\Help;

use App\Entity\Help\Help;
use App\Entity\Help\HelpContent;
use App\Entity\Language\Language;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class HelpContentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HelpContent::class);
    }

    public function create(Help $help, Language $language): HelpContent
    {
        $text = 'Update is expected soon';
        $helpContent = new HelpContent();
        $helpContent->setHelp($help);
        $helpContent->setLanguage($language);
        $helpContent->setTitle($text);
        $helpContent->setSeoKeywords($text);
        $helpContent->setSeoDescription($text);;
        $helpContent->setShortDescription($text);
        $helpContent->setDescription($text);

        return $helpContent;
    }

    public function getByHelpId(string $helpId, string $locale): ?HelpContent
    {
        return $this->createQueryBuilder('hc')
            ->addSelect('hc')
            ->join('hc.help', 'h')
            ->join('hc.language', 'l')
            ->where('hc.help = :help')
            ->setParameter('help', $helpId)
            ->andWhere('l.code = :locale')
            ->setParameter('locale', $locale)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function fetchByHelpIds(array $helpIds, string $locale): array
    {
        return $this->createQueryBuilder('hc')
            ->addSelect('hc')
            ->join('hc.help', 'h')
            ->join('hc.language', 'l')
            ->where('hc.help IN (:help)')
            ->setParameter('help', $helpIds)
            ->andWhere('l.code = :locale')
            ->setParameter('locale', $locale)
            ->getQuery()
            ->getResult();
    }
}
