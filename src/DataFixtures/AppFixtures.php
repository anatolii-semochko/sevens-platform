<?php

namespace App\DataFixtures;

use App\Entity\Category\Category;
use App\Entity\Language\Language;
use App\Entity\Material\Material;
use App\Entity\PagesContent\Page;
use App\Entity\User;
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
            ['a6e26b6d-092e-4677-b822-82ea07e3163c', '/register', []],
            ['d5e81a1a-49cc-4d8e-9f6f-69d0f9725b35', '/login', []],
            ['176c4e5f-04c6-47c8-92b1-667e9abf99e3', '/user', []],
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

        // Create a default user for materials
        $user = new User();
        $user->setEmail('demo@example.com');
        $user->setFirstName('Demo');
        $user->setLastName('User');
        $user->setPassword('$2y$13$demo'); // placeholder password
        $manager->persist($user);
        $manager->flush(); // Flush to get user ID

        // Load Materials with existing data
        $materialsData = [
            ['08dac8bd058be22da5d883d495892f85', 'Creative Workspace', 'Laptop and teamwork in focus.', 'Gallery-12.jpg'],
            ['0cea6d9cb7c8c2dfb62fa4cd51d70b72', 'UX Flowchart', 'Planning user journey on paper.', 'Gallery-25.jpg'],
            ['1508a63027051490840c0fba66a4390d', 'Design Meeting', 'Colleagues discussing ideas around a screen.', 'Gallery-20.jpg'],
            ['1b54f55b3ebf7c8bd5d0c7d1c8b91881', 'Design Meeting', 'Colleagues discussing ideas around a screen.', 'Gallery-14.jpg'],
            ['1da2ee786acb5843e11790c1d32b6779', 'Design Sprint', 'Sticky notes for brainstorming.', 'Gallery-11.jpg'],
            ['2b2379782bab335c48b729ce340e6eab', 'Whiteboard Planning', 'Sketching ideas in action.', 'Gallery-3.jpg'],
            ['335975c3c24bed8d03c438719047b4f8', 'Design Meeting', 'Colleagues discussing ideas around a screen.', 'Gallery-24.jpg'],
            ['3a2d9da540201f07933b740bfa5c491c', 'Whiteboard Planning', 'Sketching ideas in action.', 'Gallery-13.jpg'],
            ['3e60e199c3e2f9e74f0b7a63cd78f25b', 'Design Sprint', 'Sticky notes for brainstorming.', 'Gallery-7.jpg'],
            ['437fd26f6d6a1e83dceffd3dc753ae27', 'Design Meeting', 'Colleagues discussing ideas around a screen.', 'Gallery-4.jpg'],
            ['4e234ffccfdb7639cebab9d3a0bad1bf', 'Design Sprint', 'Sticky notes for brainstorming.', 'Gallery-17.jpg'],
            ['534f7dafbc75009608bee85ab9532776', 'Creative Workspace', 'Laptop and teamwork in focus.', 'Gallery-8.jpg'],
            ['54c7f0242326384570f892814cff75bb', 'Design Sprint', 'Sticky notes for brainstorming.', 'Gallery-1.jpg'],
            ['55b835dfbe296397be4e0b0f48ada59a', 'Startup Workspace', 'A modern desk with a startup vibe.', 'Gallery-26.jpg'],
            ['7174dc33903a8983c3da1bdf34896e3a', 'Creative Workspace', 'Laptop and teamwork in focus.', 'Gallery-28.jpg'],
            ['768b4c008a6d1a5a0dc5cac6b87e2a16', 'Whiteboard Planning', 'Sketching ideas in action.', 'Gallery-29.jpg'],
            ['7a4e6206853ce6a646887d0a5d13db05', 'Whiteboard Planning', 'Sketching ideas in action.', 'Gallery-23.jpg'],
            ['8274b80e54a62afc568882321bfcdc6d', 'Whiteboard Planning', 'Sketching ideas in action.', 'Gallery-19.jpg'],
            ['82d4192deb2cdaee3632186fc655cb24', 'Startup Workspace', 'A modern desk with a startup vibe.', 'Gallery-6.jpg'],
            ['8f603d4a58274e4f66e11ad252555b78', 'Creative Workspace', 'Laptop and teamwork in focus.', 'Gallery-18.jpg'],
            ['998b74cbebd5ccf57eedfab8a8eddb3b', 'Design Sprint', 'Sticky notes for brainstorming.', 'Gallery-27.jpg'],
            ['a7f07d5a9ea8109096887706b5ed102b', 'Creative Workspace', 'Laptop and teamwork in focus.', 'Gallery-22.jpg'],
            ['a855fc2d29bdf84c13f741ac388965dc', 'UX Flowchart', 'Planning user journey on paper.', 'Gallery-5.jpg'],
            ['ae6a82422f08939cffbc0d0a8af65e1e', 'UX Flowchart', 'Planning user journey on paper.', 'Gallery-15.jpg'],
            ['c4ff941bf407c59880a681e031afee4a', 'Whiteboard Planning', 'Sketching ideas in action.', 'Gallery-9.jpg'],
            ['dc5485d6984be553bddf628c1f7b0907', 'Design Sprint', 'Sticky notes for brainstorming.', 'Gallery-21.jpg'],
            ['e1c61d1e8655912f42bd9ce289489e2b', 'Design Meeting', 'Colleagues discussing ideas around a screen.', 'Gallery-10.jpg'],
            ['e57d588b2d0beb1d057de3d63ba03dce', 'Design Meeting', 'Colleagues discussing ideas around a screen.', 'Gallery-30.jpg'],
            ['f35933c8eb8512a679253abbd2503f03', 'Startup Workspace', 'A modern desk with a startup vibe.', 'Gallery-16.jpg'],
            ['ff312c86bca524d948dd9ae318c7a271', 'Creative Workspace', 'Laptop and teamwork in focus.', 'Gallery-2.jpg']
        ];

        foreach ($materialsData as $materialData) {
            $material = new Material();
            $material->setToken($materialData[0]);
            $material->setTitle($materialData[1]);
            $material->setDescription($materialData[2]);
            $material->setLogo($materialData[3]);
            $material->setAuthor($user);
            $material->setCreatedAt(new \DateTime());
            $material->setContractAddress('0x' . bin2hex(random_bytes(20)));
            $manager->persist($material);
        }

        $manager->flush();
    }
}
