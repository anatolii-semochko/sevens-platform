<?php

namespace App\Service\Template;

class TemplateService
{
    public function getData(): array
    {
        return [
            'header' => [],
            'sideBar' => [],
            'footer' => [],
        ];
    }
}
