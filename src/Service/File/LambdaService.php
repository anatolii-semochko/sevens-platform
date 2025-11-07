<?php

declare(strict_types=1);

namespace App\Service\File;

use Aws\Lambda\LambdaClient;
use Aws\Exception\AwsException;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

readonly class LambdaService
{
    private LambdaClient $lambdaClient;
    private string $validatorFunctionName;
    private int $timeout;

    public function __construct(
        private ParameterBagInterface $params
    ) {
        $config = [
            'version' => 'latest',
            'region' => $this->params->get('aws.region'),
            'credentials' => [
                'key' => $this->params->get('aws.access_key_id'),
                'secret' => $this->params->get('aws.secret_access_key'),
            ],
        ];

        // Add endpoint for LocalStack
        if ($endpoint = $this->params->get('aws.endpoint')) {
            $config['endpoint'] = $endpoint;
        }

        $this->lambdaClient = new LambdaClient($config);
        $this->validatorFunctionName = $this->params->get('aws.lambda.material_validator_function');
        $this->timeout = (int) $this->params->get('aws.lambda.timeout');
    }

    /**
     * Invoke material ZIP validator Lambda function.
     *
     * @param string $bucket S3 bucket name
     * @param string $key S3 object key
     * @param string $materialToken Material token
     * @param array<string, mixed>|null $containerMetadata Optional container metadata for validation
     * @return array<string, mixed> Lambda response
     * @throws \RuntimeException
     */
    public function validateMaterialArchive(
        string $bucket,
        string $key,
        string $materialToken,
        ?array $containerMetadata = null
    ): array {
        $payload = [
            'bucket' => $bucket,
            'key' => $key,
            'materialToken' => $materialToken,
        ];

        // Add container metadata if provided (for validation)
        if ($containerMetadata !== null) {
            $payload['containerMetadata'] = $containerMetadata;
        }

        try {
            $result = $this->lambdaClient->invoke([
                'FunctionName' => $this->validatorFunctionName,
                'InvocationType' => 'RequestResponse', // Synchronous invocation
                'Payload' => json_encode($payload),
            ]);

            $responsePayload = json_decode($result->get('Payload')->getContents(), true);

            // Check for Lambda execution errors
            if (isset($result['FunctionError'])) {
                throw new \RuntimeException(
                    "Lambda function error: " . ($responsePayload['errorMessage'] ?? 'Unknown error')
                );
            }

            return $responsePayload;
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to invoke Lambda function: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        } catch (\JsonException $e) {
            throw new \RuntimeException("Failed to decode Lambda response: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Invoke Lambda function asynchronously (fire and forget).
     *
     * @param array<string, mixed> $payload Lambda event payload
     * @throws \RuntimeException
     */
    public function validateMaterialArchiveAsync(string $bucket, string $key, string $materialToken): void
    {
        $payload = [
            'bucket' => $bucket,
            'key' => $key,
            'materialToken' => $materialToken,
        ];

        try {
            $this->lambdaClient->invoke([
                'FunctionName' => $this->validatorFunctionName,
                'InvocationType' => 'Event', // Asynchronous invocation
                'Payload' => json_encode($payload),
            ]);
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to invoke Lambda function asynchronously: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }

    /**
     * Deploy Lambda function to LocalStack.
     * This is typically called during development setup.
     *
     * @throws \RuntimeException
     */
    public function deployValidatorFunction(string $zipFilePath): string
    {
        try {
            // Check if function already exists
            try {
                $this->lambdaClient->getFunction([
                    'FunctionName' => $this->validatorFunctionName,
                ]);

                // Function exists, update it
                $result = $this->lambdaClient->updateFunctionCode([
                    'FunctionName' => $this->validatorFunctionName,
                    'ZipFile' => file_get_contents($zipFilePath),
                ]);

                return $result->get('FunctionArn');
            } catch (AwsException $e) {
                // Function doesn't exist, create it
                $result = $this->lambdaClient->createFunction([
                    'FunctionName' => $this->validatorFunctionName,
                    'Runtime' => 'python3.11',
                    'Role' => 'arn:aws:iam::000000000000:role/lambda-role',
                    'Handler' => 'handler.lambda_handler',
                    'Code' => [
                        'ZipFile' => file_get_contents($zipFilePath),
                    ],
                    'Timeout' => $this->timeout,
                    'MemorySize' => 512,
                    'Environment' => [
                        'Variables' => [
                            'AWS_ENDPOINT' => $this->params->get('aws.endpoint'),
                            'AWS_REGION' => $this->params->get('aws.region'),
                            'AWS_ACCESS_KEY_ID' => $this->params->get('aws.access_key_id'),
                            'AWS_SECRET_ACCESS_KEY' => $this->params->get('aws.secret_access_key'),
                        ],
                    ],
                ]);

                return $result->get('FunctionArn');
            }
        } catch (AwsException $e) {
            throw new \RuntimeException(
                "Failed to deploy Lambda function: {$e->getMessage()}",
                $e->getStatusCode(),
                $e
            );
        }
    }
}
