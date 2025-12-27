# AWS File Storage Setup Guide

This guide explains the AWS S3 + Lambda integration for material archive storage and validation.

## Overview

The system provides:
1. **Presigned S3 Upload** - Direct browser-to-S3 uploads with blockchain hash validation
2. **Lambda Validation** - Validates ZIP archives and extracts images
3. **Material Management** - Creates materials with validated archives
4. **CDN Integration** - Serves files via Cloudflare or Nginx proxy

## Architecture

```
User → Request Presigned URL → Backend validates token in blockchain
                                        ↓
User → Upload ZIP to S3 → Temporary storage (temp/) → Backend creates material
                                        ↓
                            Lambda validates & extracts → Permanent storage (materials/)
                                        ↓
                                Material created with files
```

## Initial Setup

### 1. Start Docker Containers

```bash
make up
```

This automatically:
- Starts LocalStack (S3 + Lambda services)
- Creates S3 bucket: `sevenstime-materials`
- Deploys Lambda function: `material-zip-validator`
- Configures CORS and bucket policies

**Note:** Lambda deployment is automated via `docker/development/localstack/init-aws.sh`

### 2. Generate and Run Migration

```bash
# Generate migration for Material entity fields
make migration-diff

# Review migration in migrations/ directory
# Then apply:
make migration-migrate
```

## Configuration

### Environment Variables (.env)

```bash
# LocalStack Configuration (Development)
AWS_ENDPOINT=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_USE_PATH_STYLE_ENDPOINT=true

# S3 Configuration
AWS_S3_MATERIALS_BUCKET=sevenstime-materials
AWS_S3_PRESIGNED_EXPIRATION=900          # 15 minutes
AWS_S3_PUBLIC_ENDPOINT=http://localhost:4566/sevenstime-materials

# CDN Configuration
CDN_ENABLED=false                         # Use Nginx proxy in dev
CDN_BASE_URL=https://localhost/s3/sevenstime-materials

# Lambda Configuration
AWS_LAMBDA_MATERIAL_VALIDATOR_FUNCTION=material-zip-validator
AWS_LAMBDA_TIMEOUT=300                    # 5 minutes
```

### Production Configuration

For production (real AWS):

```bash
# Remove LocalStack endpoint
AWS_ENDPOINT=                             # Empty = use real AWS
AWS_USE_PATH_STYLE_ENDPOINT=false
AWS_REGION=us-east-1

# Real AWS credentials
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxx

# S3 bucket (must exist)
AWS_S3_MATERIALS_BUCKET=sevenstime-materials-prod
AWS_S3_PUBLIC_ENDPOINT=                   # Empty = use CDN

# Enable Cloudflare CDN
CDN_ENABLED=true
CDN_BASE_URL=https://files.sevenstime.com

# Deploy Lambda to AWS Lambda service
# Upload lambda/material-validator/function.zip via AWS Console or CLI
```

## API Endpoints

### 1. Get Presigned Upload URL

Request presigned S3 upload URL (validates token ownership in blockchain):

```http
POST /api/material/presigned-upload-url
Content-Type: application/json
Authorization: Bearer {token}

{
  "tokenPublicKey": "abc123...",
  "fileName": "archive.zip",
  "containerMd5": "base64encodedmd5hash"  // Optional
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/temp/...?signature=...",
  "tempS3Key": "temp/material-uploads/abc123.../archive.zip",
  "bucket": "sevenstime-materials",
  "expiresAt": "2025-12-27T12:00:00Z"
}
```

**Security:**
- Validates token exists in blockchain
- Validates user owns the token (via wallet signature)
- Checks material doesn't already exist
- Returns presigned URL valid for 15 minutes
- Client must upload with `x-amz-checksum-sha256` header

### 2. Create Material

Create material after uploading archive to S3:

```http
POST /api/material/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "tokenPublicKey": "abc123...",
  "walletSignature": {
    "walletPublicKey": "xyz789...",
    "signature": "base64signature...",
    "message": "signedmessage..."
  },
  "s3Upload": {
    "tempS3Key": "temp/material-uploads/abc123.../archive.zip",
    "fileName": "archive.zip"
  }
}
```

**Response:**
```json
{
  "created": true,
  "material": {
    "token": "abc123...",
    "title": "",
    "description": "",
    "archiveStatus": "validated",
    "files": [
      {
        "key": "materials/abc123.../images/photo1.jpg",
        "keyPreview": "materials/abc123.../images/photo1_preview.jpg",
        "keyThumbnail": "materials/abc123.../images/photo1_thumb.jpg",
        "name": "photo1.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg"
      }
    ]
  }
}
```

**Workflow:**
1. Backend fetches token from blockchain (source of truth)
2. Validates user owns the token
3. Lambda validates uploaded file hash === blockchain hash
4. If valid: Moves to permanent storage + extracts images
5. Material created with extracted files

### 3. Check Archive Processing Status

```http
GET /api/material/{token}/archive-status
Authorization: Bearer {token}
```

**Response (Validated):**
```json
{
  "status": "validated",
  "error": null,
  "files": [
    {
      "key": "materials/abc123.../images/photo1.jpg",
      "keyPreview": "materials/abc123.../images/photo1_preview.jpg",
      "keyThumbnail": "materials/abc123.../images/photo1_thumb.jpg",
      "name": "photo1.jpg",
      "url": "https://files.sevenstime.com/materials/..."
    }
  ]
}
```

**Response (Failed):**
```json
{
  "status": "failed",
  "error": "Hash mismatch: uploaded file doesn't match blockchain hash"
}
```

### 4. Update Material

```http
PATCH /api/material/{token}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "My Material",
  "description": "Description...",
  "logo": "materials/abc123.../images/photo1_thumb.jpg",
  "active": true
}
```

### 5. Delete Material

```http
DELETE /api/material/{token}
Authorization: Bearer {token}
```

Deletes material only if token doesn't exist in blockchain (burned/deleted tokens only).

## Database Schema

New fields in `materials` table:

| Field | Type | Description |
|-------|------|-------------|
| `archive_s3_key` | varchar(255) | S3 key of permanent archive |
| `archive_s3_bucket` | varchar(100) | S3 bucket name |
| `archive_status` | varchar(20) | pending/processing/validated/failed |
| `archive_validation_error` | text | Error if validation fails |
| `archive_hash` | varchar(64) | SHA-256 hash from blockchain |
| `archived_at` | datetime | When archive was uploaded |
| `files` | json | Extracted files with metadata |

## Services

### S3Service
**Location:** `src/Service/File/S3Service.php`

**Methods:**
- `uploadFile(UploadedFile $file, string $key): string`
- `getPresignedUploadUrl(string $key, string $contentType, ?int $exp, ?string $md5, ?string $sha256Hash): string`
- `getPresignedDownloadUrl(string $key, ?int $expirationSeconds): string`
- `deleteFile(string $key): void`
- `copyFile(string $sourceKey, string $destKey): void`
- `fileExists(string $key): bool`
- `getFileMetadata(string $key): array`

### LambdaService
**Location:** `src/Service/File/LambdaService.php`

**Methods:**
- `validateMaterialArchive(string $bucket, string $key, string $materialToken, ?array $containerMetadata): array`

**Note:** Lambda deployment is automated via shell script, not PHP code.

### CdnService
**Location:** `src/Service/File/CdnService.php`

**Methods:**
- `getUrl(string $s3Key): string`
- `getUrls(array $s3Keys): array`

### MaterialFileService
**Location:** `src/Service/Material/MaterialFileService.php`

**Main Methods:**
- `preparePresignedUploadForToken(string $tokenPublicKey, string $fileName, ?string $containerMd5): array`
- `moveAndProcessTempArchive(Material $material, string $tempS3Key, string $fileName): void`
- `validateUploadedContainer(string $tempS3Key, SevensTokenContainer $expectedContainer): array`
- `getFilesWithUrls(Material $material): array`
- `deleteTempFile(string $tempS3Key): void`
- `deleteArchive(Material $material): void`

## Lambda Function

**Location:** `lambda/material-validator/handler.py`

**Functionality:**
1. Downloads ZIP from S3 (temp storage)
2. Validates ZIP structure and size (max 100 MB)
3. Validates file hash matches expected hash (blockchain)
4. Extracts images (jpg, jpeg, png, gif, webp, bmp, svg)
5. Generates optimized versions (preview, thumbnail)
6. Uploads to permanent S3 storage with organized paths
7. Returns metadata for all processed files

**Limits:**
- Max ZIP size: 100 MB
- Max file size: 20 MB per image
- Max images: 100
- Allowed formats: jpg, jpeg, png, gif, webp, bmp, svg

**Auto-deployment:**
- Development: Deployed automatically by `docker/development/localstack/init-aws.sh`
- Production: Deploy manually via AWS Console or CLI

## Frontend Integration Example

```javascript
import MaterialApi from '@react/api/materialApi'
import { getFileMd5 } from '@react/components/create-token-material/utils/files'

const materialApi = new MaterialApi()

// 1. Get presigned upload URL
const file = document.getElementById('fileInput').files[0]
const containerMd5 = await getFileMd5(file)

const presignedData = await materialApi.getPresignedUploadUrl(
  tokenPublicKey,
  file.name,
  containerMd5
)

// 2. Upload directly to S3
await materialApi.uploadToS3(
  presignedData.uploadUrl,
  file,
  (progress) => console.log(`Upload: ${progress}%`),
  containerMd5
)

// 3. Create material
const response = await materialApi.create(
  tokenPublicKey,
  walletSignature,
  {
    tempS3Key: presignedData.tempS3Key,
    fileName: file.name,
    bucket: presignedData.bucket
  }
)

console.log('Material created:', response.material)
```

## Troubleshooting

### LocalStack Not Starting
```bash
# Check logs
docker compose logs localstack

# Restart
docker compose restart localstack

# Re-run init script
docker compose exec localstack sh /etc/localstack/init/ready.d/init-aws.sh
```

### Lambda Function Errors
```bash
# Check Lambda logs
docker compose exec php-cli bash
awslocal logs tail /aws/lambda/material-zip-validator --follow

# Re-deploy Lambda
cd docker/development/localstack
./init-aws.sh
```

### S3 Upload Fails
```bash
# Test S3 connection
docker compose exec php-cli bash
awslocal s3 ls s3://sevenstime-materials/

# Check bucket exists
awslocal s3api head-bucket --bucket sevenstime-materials
```

### Hash Mismatch Errors

If you get "Hash mismatch" errors:
1. Ensure `x-amz-checksum-sha256` header is sent during S3 upload
2. Verify blockchain hash matches file hash
3. Check that containerMd5 is calculated correctly

## Production Deployment Checklist

- [ ] Create S3 bucket in AWS
- [ ] Configure S3 CORS policy
- [ ] Deploy Lambda function to AWS Lambda
- [ ] Set up CloudWatch logging for Lambda
- [ ] Configure Cloudflare CDN (see CLOUDFLARE_CDN_SETUP.md)
- [ ] Set production environment variables
- [ ] Test upload workflow end-to-end
- [ ] Set up monitoring/alerts for Lambda errors

## Security Features

1. **Blockchain Validation:** Token ownership verified before upload
2. **Hash Validation:** SHA-256 checksum validated by S3
3. **Lambda Validation:** Uploaded file hash === blockchain hash
4. **Presigned URLs:** Time-limited (15min), single-use URLs
5. **File Type Validation:** Only allowed image formats
6. **Size Limits:** Enforced at multiple levels (PHP, Lambda, S3)