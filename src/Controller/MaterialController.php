<?php

namespace App\Controller;

use App\Service\Material\MaterialService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

class MaterialController extends AbstractController
{
    public function __construct(
        private MaterialService $materialService,
    ) {}
    
    #[Route('/', name: 'main_page', methods: ['GET'])]
    public function index(): Response
    {   
        return $this->render('base.html.twig', [
//            'sidebar_template' => 'components/sidebar.html.twig',
//            'sidebar_data' => [
//                'menu_items' => ['Home', 'About', 'Contact']
//            ],
            'main_template' => 'pages/gallery/index.twig',
            'main_data' => [
                'materials' => $this->materialService->fetch(),
            ],
        ]);
    }
}
