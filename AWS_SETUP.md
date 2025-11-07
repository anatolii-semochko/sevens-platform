# AWS File Storage Setup Guide

This guide explains how to set up and use the AWS S3 + Lambda integration for material file storage.

## Overview

The system provides:
1. **ZIP Archive Upload** to S3/LocalStack
2. **Lambda Validation** that extracts and validates images
3. **Image Gallery Management** with user-selected images
4. **CDN Integration** for serving images

## Architecture

```
User → Upload ZIP → S3/LocalStack → Lambda Validator → Extract Images → S3
                                         ↓
                                    Update Material
                                         ↓
                              Return Available Images
                                         ↓
                              User Selects Images
                                         ↓
                                  Gallery Ready
```

## Initial Setup

### 1. Start Docker Containers

```bash
make up
```

This will start:
- LocalStack (S3 + Lambda services)
- PHP containers
- Database
- All other services

### 2. Install AWS SDK

```bash
docker compose exec php-cli composer require aws/aws-sdk-php
```

### 3. Generate and Run Migration

```bash
# Generate migration for new Material entity fields
make migration-diff

# Review the migration in migrations/ directory
# Then apply it:
make migration-migrate
```

### 4. Deploy Lambda Function

The Lambda function needs to be deployed to LocalStack. Create a deployment script or run:

```bash
# From project root, create Lambda deployment package
cd lambda/material-validator
zip -r function.zip handler.py

# Deploy via PHP console command (you may need to create this)
# Or manually via AWS CLI:
docker compose exec php-cli bash
awslocal lambda create-function \
  --function-name material-zip-validator \
  --runtime python3.11 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler handler.lambda_handler \
  --zip-file fileb:///path/to/function.zip \
  --timeout 300
```

## Configuration

### Environment Variables (.env)

```bash
# LocalStack Configuration
AWS_ENDPOINT=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_USE_PATH_STYLE_ENDPOINT=true

# S3 Buckets
AWS_S3_MATERIALS_BUCKET=sevenstime-materials
AWS_S3_PRESIGNED_EXPIRATION=3600

# CDN Configuration
CDN_BASE_URL=http://localhost:4566/sevenstime-materials
CDN_ENABLED=false

# Lambda Configuration
AWS_LAMBDA_MATERIAL_VALIDATOR_FUNCTION=material-zip-validator
AWS_LAMBDA_TIMEOUT=300
```

### Production Configuration

For production (real AWS):

1. Remove `AWS_ENDPOINT` from .env
2. Set `AWS_USE_PATH_STYLE_ENDPOINT=false`
3. Use real AWS credentials
4. Enable CDN: `CDN_ENABLED=true`
5. Set `CDN_BASE_URL` to your CloudFront distribution URL
6. Deploy Lambda to real AWS Lambda service

## API Endpoints

### 1. Upload Archive

```http
POST /api/material/{token}/upload-archive
Content-Type: multipart/form-data

Form Data:
- archive: [ZIP file]
```

**Response:**
```json
{
  "success": true,
  "status": "processing",
  "message": "Archive uploaded and processing started"
}
```

### 2. Check Processing Status

```http
GET /api/material/{token}/archive-status
```

**Response (Processing):**
```json
{
  "status": "processing",
  "error": null
}
```

**Response (Validated):**
```json
{
  "status": "validated",
  "error": null,
  "files": [
    {
      "key": "materials/abc123/images/photo1.jpg",
      "name": "photo1.jpg",
      "size": 1024000,
      "type": "jpg",
      "url": "http://localhost:4566/sevenstime-materials/materials/abc123/images/photo1.jpg"
    }
  ],
  "availableImages": [...],
  "galleryImages": [...]
}
```

**Note:** `availableImages` and `galleryImages` are included for backward compatibility and contain the same data as `files`.

**Response (Failed):**
```json
{
  "status": "failed",
  "error": "No valid images found in ZIP archive"
}
```

### 3. Select Gallery Images

```http
PUT /api/material/{token}/select-images
Content-Type: application/json

{
  "selectedImageKeys": [
    "materials/abc123/images/photo1.jpg",
    "materials/abc123/images/photo2.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "key": "materials/abc123/images/photo1.jpg",
      "name": "photo1.jpg",
      "size": 1024000,
      "type": "jpg",
      "url": "http://localhost:4566/..."
    }
  ],
  "galleryImages": [...]
}
```

**Note:** `galleryImages` is included for backward compatibility and contains the same data as `files`.

### 4. Get Archive Download URL

```http
GET /api/material/{token}/archive-download-url
```

**Response:**
```json
{
  "downloadUrl": "http://localhost:4566/...?presigned_signature=..."
}
```

### 5. Delete Archive

```http
DELETE /api/material/{token}/archive
```

**Response:**
```json
{
  "success": true,
  "message": "Archive deleted"
}
```

## Database Schema Changes

New fields added to `materials` table:

| Field | Type | Description |
|-------|------|-------------|
| `archive_s3_key` | varchar(255) | S3 key/path of uploaded ZIP |
| `archive_s3_bucket` | varchar(100) | S3 bucket name |
| `archive_status` | varchar(20) | Status: pending/processing/validated/failed |
| `archive_validation_error` | text | Error message if validation fails |
| `files` | json | Array of all extracted/selected files with metadata |

## Services

### S3Service
**Location:** `src/Service/File/S3Service.php`

**Methods:**
- `uploadFile(UploadedFile $file, string $key): string`
- `uploadFromString(string $content, string $key, string $contentType): string`
- `getPresignedDownloadUrl(string $key, ?int $expirationSeconds): string`
- `deleteFile(string $key): void`
- `fileExists(string $key): bool`
- `getFileMetadata(string $key): array`

### LambdaService
**Location:** `src/Service/File/LambdaService.php`

**Methods:**
- `validateMaterialArchive(string $bucket, string $key, string $materialToken): array`
- `validateMaterialArchiveAsync(string $bucket, string $key, string $materialToken): void`
- `deployValidatorFunction(string $zipFilePath): string`

### CdnService
**Location:** `src/Service/File/CdnService.php`

**Methods:**
- `getUrl(string $s3Key): string`
- `getUrls(array $s3Keys): array`
- `addUrlsToImages(array $images): array`

### MaterialFileService
**Location:** `src/Service/Material/MaterialFileService.php`

**Methods:**
- `uploadArchive(Material $material, UploadedFile $file): void`
- `processArchive(Material $material): void`
- `selectGalleryImages(Material $material, array $selectedImageKeys): void`
- `getFilesWithUrls(Material $material): array`
- `getAvailableImagesWithUrls(Material $material): array` *(deprecated, use getFilesWithUrls)*
- `getGalleryImagesWithUrls(Material $material): array` *(deprecated, use getFilesWithUrls)*
- `getArchiveDownloadUrl(Material $material, ?int $expirationSeconds): string`
- `deleteArchive(Material $material): void`

## Lambda Function

**Location:** `lambda/material-validator/`

**Functionality:**
1. Downloads ZIP from S3
2. Validates ZIP structure and size (max 100 MB)
3. Extracts images (jpg, jpeg, png, gif, webp, bmp)
4. Validates each image (max 20 MB per file, max 100 images)
5. Uploads extracted images to S3 with organized paths
6. Returns list of images with metadata

**Limits:**
- Max ZIP size: 100 MB
- Max file size: 20 MB
- Max images: 100
- Allowed formats: jpg, jpeg, png, gif, webp, bmp

## Frontend Integration Example

```javascript
// 1. Upload ZIP
const formData = new FormData();
formData.append('archive', zipFile);

const uploadResponse = await fetch(`/api/material/${token}/upload-archive`, {
  method: 'POST',
  body: formData
});

// 2. Poll for status
const checkStatus = async () => {
  const response = await fetch(`/api/material/${token}/archive-status`);
  const data = await response.json();

  if (data.status === 'validated') {
    // Show files
    displayImages(data.files);
  } else if (data.status === 'processing') {
    // Continue polling
    setTimeout(checkStatus, 2000);
  } else if (data.status === 'failed') {
    // Show error
    console.error(data.error);
  }
};

checkStatus();

// 3. Select images
const selectImages = async (imageKeys) => {
  const response = await fetch(`/api/material/${token}/select-images`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedImageKeys: imageKeys })
  });

  const data = await response.json();
  // data.files now contains selected images
};
```

## Troubleshooting

### LocalStack Not Starting
```bash
# Check logs
docker compose logs localstack

# Restart
docker compose restart localstack
```

### Lambda Function Errors
```bash
# Check Lambda logs
docker compose exec php-cli bash
awslocal logs tail /aws/lambda/material-zip-validator --follow
```

### S3 Connection Issues
```bash
# Test S3 connection
docker compose exec php-cli bash
awslocal s3 ls
```

### Migration Issues
```bash
# Clear cache
docker compose exec php-cli php bin/console cache:clear

# Validate schema
make validate-schema
```

## Testing

### Manual Testing with cURL

```bash
# Upload archive
curl -X POST http://localhost:8080/api/material/{token}/upload-archive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "archive=@/path/to/archive.zip"

# Check status
curl http://localhost:8080/api/material/{token}/archive-status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Select images
curl -X PUT http://localhost:8080/api/material/{token}/select-images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"selectedImageKeys": ["materials/abc/images/img1.jpg"]}'
```

## Production Deployment Checklist

- [ ] Deploy Lambda function to AWS Lambda
- [ ] Create S3 bucket for materials
- [ ] Set up CloudFront distribution
- [ ] Update .env with production credentials
- [ ] Enable CDN: `CDN_ENABLED=true`
- [ ] Set proper IAM permissions for Lambda
- [ ] Configure bucket CORS policy
- [ ] Set up bucket lifecycle policies for cleanup
- [ ] Configure monitoring and alerts
- [ ] Run database migration on production

## Security Considerations

1. **File Validation:** Lambda validates all files before storage
2. **Size Limits:** Enforced at multiple levels (PHP, Lambda)
3. **File Types:** Only allowed image formats are processed
4. **Access Control:** All endpoints check user authorization
5. **Presigned URLs:** Limited lifetime for downloads
6. **Bucket Policy:** Configure proper access restrictions in production

## Monitoring

**Key Metrics to Monitor:**
- Upload success/failure rate
- Lambda execution time and errors
- S3 storage usage
- CDN bandwidth usage
- Failed validation reasons

**Logs to Check:**
- PHP application logs
- Lambda function logs
- LocalStack logs
- S3 access logs (in production)