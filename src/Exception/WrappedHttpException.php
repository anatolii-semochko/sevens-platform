<?php
namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

class WrappedHttpException extends HttpException
{
    public function __construct(\Throwable $previous)
    {
        // Use 401 for authentication errors, 400 for other errors
        $statusCode = $previous instanceof AuthenticationException
            ? Response::HTTP_UNAUTHORIZED
            : ($previous->getCode() ?: Response::HTTP_BAD_REQUEST);

        parent::__construct(
            $statusCode,
            $previous->getMessage(),
            $previous,
        );
    }
}
