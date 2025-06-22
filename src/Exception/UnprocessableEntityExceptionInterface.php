<?php

namespace App\Exception;

interface UnprocessableEntityExceptionInterface extends \Throwable
{
    public function getErrors(): array;
}
