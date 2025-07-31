<?php

namespace App\DataFixtures;

use App\Entity\Category\Category;
use App\Entity\Language\Language;
use App\Entity\PagesContent\Page;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Load Languages
        $languageData = [
            'id' => '8421a1ca-6f51-4b79-b10a-ade66006787d',
            'code' => 'en',
            'name' => 'English',
            'order' => 1,
            'active' => true,
            'main' => true,
        ];

        $language = new Language();
        $language->setId($languageData['id']);
        $language->setCode($languageData['code']);
        $language->setName($languageData['name']);
        $language->setOrder($languageData['order']);
        $language->setActive($languageData['active']);
        $language->setMain($languageData['main']);
        $manager->persist($language);

        // Load Pages
        $pagesData = [
            ['0a126d0e-9269-4683-94a8-e06e3869aa68', '/create-material', []],
            ['288a0090-150c-42c6-b07a-01c98ccef0d4', '/help/page', []],
            ['3141f246-1d5c-4865-b5d2-efc4ef648c2d', '/', []],
            ['3f9c9ee2-1894-40b0-a7e6-266c9118553e', '/check-token', []],
            ['6b79a1c0-7ca2-458f-8e7c-d09a0034c346', '/404', []],
            ['c018c788-a059-488c-8a1c-6bc91aed4e03', '/material', ['token', 'title', 'description']],
            ['e7a17864-626b-4ca6-9e18-142da4d66340', '/help', []],
        ];

        foreach ($pagesData as $pageData) {
            $page = new Page();
            $page->setId($pageData[0]);
            $page->setUrl($pageData[1]);
            $page->setTerms($pageData[2]);
            $manager->persist($page);
        }

        // Load Categories
        $category = new Category();
        $category->setId('d0c4950d-af4b-42a7-935c-6c5f96ae602c');
        $category->setParentCategory(null);
        $category->setMainParentId('d0c4950d-af4b-42a7-935c-6c5f96ae602c');
        $category->setActivityParentId(null);
        $category->setActive(1);
        $category->setOrder(1);
        $category->setLevel(1);
        $category->setName('Materials');
        $category->setUrl('materials');
        $category->setLogo('d0c4950d-af4b-42a7-935c-6c5f96ae602c89518f.webp');
        $category->setParents('');
        $category->setChildren('');
        $category->setChildrenInside('');
        $category->setPath('[]');

        $manager->persist($category);

        $manager->flush();
    }
}
