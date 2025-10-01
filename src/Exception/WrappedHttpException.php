<?php
namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\Response;

class WrappedHttpException extends HttpException
{
    public function __construct(\Throwable $previous)
    {
        parent::__construct(
            $previous->getCode() ?: Response::HTTP_BAD_REQUEST,
            $previous->getMessage(),
            $previous,
        );
    }
}
