<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\RedirectResponse;

class LocaleRedirectController
{
    public function redirect(): RedirectResponse
    {
        return new RedirectResponse('/en');
    }
}
