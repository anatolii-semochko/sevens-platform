# Material ZIP Validator Lambda Function

This Lambda function validates and processes material ZIP archives uploaded to S3.

## Functionality

1. **Download ZIP** from S3
2. **Validate ZIP** structure and size
3. **Extract images** from ZIP
4. **Upload images** to S3 with organized paths
5. **Return metadata** of all extracted images

## Configuration

### Environment Variables
- `AWS_ENDPOINT`: LocalStack endpoint (default: http://localstack:4566)
- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### Limits
- Max ZIP size: 100 MB
- Max individual file size: 20 MB
- Max images: 100
- Allowed formats: jpg, jpeg, png, gif, webp, bmp

## Event Structure

```json
{
  "bucket": "sevenstime-materials",
  "key": "materials/abc123/archive.zip",
  "materialToken": "abc123"
}
```

## Response Structure

### Success
```json
{
  "success": true,
  "status": "validated",
  "images": [
    {
      "key": "materials/abc123/images/photo1.jpg",
      "name": "photo1.jpg",
      "size": 1024000,
      "type": "jpg"
    }
  ],
  "totalImages": 1
}
```

### Failure
```json
{
  "success": false,
  "status": "failed",
  "error": "Error message",
  "images": []
}
```

## Deployment to LocalStack

The function is deployed to LocalStack via the PHP service using AWS SDK.

## Testing Locally

```bash
# Build Docker image
docker build -f Dockerfile.lambda -t material-validator .

# Test locally (requires LocalStack running)
docker run -e AWS_ENDPOINT=http://localstack:4566 \
  -e AWS_ACCESS_KEY_ID=test \
  -e AWS_SECRET_ACCESS_KEY=test \
  material-validator
```