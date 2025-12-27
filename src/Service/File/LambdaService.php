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

}
