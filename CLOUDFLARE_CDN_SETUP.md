# Cloudflare CDN Setup for Material Files

## Overview

Material files (images, videos, etc.) are stored in AWS S3 and served to users through a CDN proxy:

- **Development**: Nginx proxy → LocalStack S3
- **Production**: Cloudflare → AWS S3

This approach provides:
- ✅ Security (hides direct S3 URLs)
- ✅ Performance (Cloudflare's global CDN)
- ✅ Cost savings (Cloudflare bandwidth vs S3 egress)
- ✅ DDoS protection and caching

## How It Works

### Development (LocalStack)

```
User Browser → https://localhost/s3/sevenstime-materials/materials/token/files/image.png
             → Nginx Proxy (/s3/ location)
             → http://localstack:4566/sevenstime-materials/materials/token/files/image.png
             → LocalStack S3 (Docker container)
```

**Configuration (.env)**:
```env
CDN_ENABLED=true
CDN_BASE_URL=https://localhost/s3/sevenstime-materials
```

### Production (Real S3 + Cloudflare)

```
User Browser → https://files.sevenstime.com/materials/token/files/image.png
             → Cloudflare CDN (caches file)
             → https://sevenstime-materials.s3.us-east-1.amazonaws.com/materials/token/files/image.png
             → AWS S3 Bucket
```

**Configuration (.env.prod)**:
```env
CDN_ENABLED=true
CDN_BASE_URL=https://files.sevenstime.com
AWS_ENDPOINT=                          # Empty for real AWS
AWS_S3_MATERIALS_BUCKET=sevenstime-materials
AWS_REGION=us-east-1                   # Your AWS region
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXX       # Real AWS credentials
AWS_SECRET_ACCESS_KEY=xxxxxxxx         # Real AWS credentials
```

## Production Setup Steps

### 1. Create S3 Bucket

```bash
# Create bucket (via AWS Console or CLI)
aws s3 mb s3://sevenstime-materials --region us-east-1

# Set bucket policy (allow Cloudflare IPs or make public)
# See: https://developers.cloudflare.com/fundamentals/reference/cdn-cgi-endpoint/
```

### 2. Configure S3 CORS (Important!)

Add CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["https://sevenstime.com", "https://files.sevenstime.com"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

### 3. Set Up Cloudflare

#### Option A: Subdomain (Recommended)

1. Add DNS record in Cloudflare:
   ```
   Type: CNAME
   Name: files
   Target: sevenstime-materials.s3.us-east-1.amazonaws.com
   Proxy: ✅ Proxied (orange cloud)
   ```

2. SSL/TLS mode: **Full** (not Flexible)

3. Page Rules (optional but recommended):
   ```
   URL: files.sevenstime.com/*
   Settings:
   - Cache Level: Standard
   - Browser Cache TTL: 1 month
   - Edge Cache TTL: 1 month
   ```

#### Option B: Path-based (files.sevenstime.com/cdn/*)

1. Use Cloudflare Workers or Page Rules to proxy `/cdn/*` to S3
2. More complex, Option A is simpler

### 4. Update Production Environment

```env
# .env.production or .env.prod
CDN_ENABLED=true
CDN_BASE_URL=https://files.sevenstime.com
AWS_S3_MATERIALS_BUCKET=sevenstime-materials
```

### 5. Test

```bash
# Upload a test file
aws s3 cp test.jpg s3://sevenstime-materials/test.jpg --acl public-read

# Test direct S3 access
curl -I https://sevenstime-materials.s3.us-east-1.amazonaws.com/test.jpg

# Test Cloudflare CDN
curl -I https://files.sevenstime.com/test.jpg

# Should return:
# - cf-cache-status header (HIT/MISS/DYNAMIC)
# - cf-ray header (Cloudflare is serving)
```

## Code Flow

### File Upload (Material Creation)

1. Frontend calls `POST /api/material/presigned-upload-url` with tokenPublicKey
2. Backend validates token in blockchain & user ownership
3. Backend returns presigned S3 upload URL (temp storage, 15min expiration)
4. Browser uploads ZIP directly to S3 with SHA-256 checksum header
5. Frontend calls `POST /api/material/create` with tempS3Key
6. Backend validates & Lambda processes:
   - Validates file hash === blockchain hash
   - Extracts images to permanent storage
   - Generates preview/thumbnail variants
7. Material created with files: `materials/{token}/images/{filename}.jpg`

### File Display (Material View/Edit)

1. Backend fetches material with files from database (`Material::$files`)
2. `MaterialFileService::getFilesWithUrls()` uses `CdnService::getUrls()` to transform S3 keys
3. Frontend receives files with CDN URLs:
   ```json
   {
     "key": "materials/abc123.../images/photo1.jpg",
     "keyPreview": "materials/abc123.../images/photo1_preview.jpg",
     "keyThumbnail": "materials/abc123.../images/photo1_thumb.jpg",
     "url": "https://files.sevenstime.com/materials/abc123.../images/photo1.jpg"
   }
   ```
4. Images rendered using CDN URLs (fast, cached globally)

**Key Files**:
- `src/Service/File/CdnService.php` - CDN URL generation
- `src/Service/File/S3Service.php` - S3 operations, presigned URLs
- `src/Service/File/LambdaService.php` - Lambda validation
- `src/Service/Material/MaterialFileService.php` - File processing orchestration
- `src/Controller/Api/MaterialController.php` - API endpoints
- `assets/react/api/materialApi.js` - Frontend API client

## Cloudflare Cache Configuration

Recommended settings for optimal performance:

### Cloudflare Dashboard → Caching → Configuration

- **Caching Level**: Standard
- **Browser Cache TTL**: 1 month (or longer for static assets)
- **Always Online**: ✅ Enabled

### Cache Rules (Page Rules)

```
files.sevenstime.com/materials/*
├─ Cache Level: Cache Everything
├─ Edge Cache TTL: 1 month
└─ Browser Cache TTL: 1 month
```

### Transform Rules (optional)

Add cache headers for better control:

```
Rule: Add Response Header
Match: files.sevenstime.com/materials/*
Header: Cache-Control
Value: public, max-age=31536000, immutable
```

## Security Considerations

### Option 1: Keep S3 Bucket Private (Recommended)

If you want maximum security (files only accessible via Cloudflare):

1. Keep S3 bucket private (no public access)
2. Use Cloudflare Workers to sign requests:

```javascript
// Cloudflare Worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const s3Url = `https://sevenstime-materials.s3.us-east-1.amazonaws.com${url.pathname}`

  // Add AWS signature headers here (requires AWS SDK)
  const response = await fetch(s3Url, {
    headers: {
      // AWS v4 signature headers
    }
  })

  return response
}
```

### Option 2: Public S3 with Cloudflare

Simpler setup:
1. Make S3 bucket public (read-only)
2. Use Cloudflare as CDN layer
3. Files accessible via both S3 and Cloudflare URLs (but users only see Cloudflare)

## Cost Optimization

### Cloudflare Bandwidth Savings

- S3 egress: ~$0.09/GB (first 10TB)
- Cloudflare: Free (unlimited on all plans for cached content)

**Example**: 1TB/month traffic
- Without Cloudflare: $90/month
- With Cloudflare: ~$0 (if 99% cache hit rate)

### S3 Storage Costs

- Standard: $0.023/GB/month
- Intelligent-Tiering: Automatic cost optimization
- Consider lifecycle policies for old materials

## Monitoring

### Cloudflare Analytics

Monitor:
- Cache hit ratio (aim for >95%)
- Bandwidth saved
- Top requested files
- Geographic distribution

### AWS CloudWatch

Monitor:
- S3 request metrics
- Lambda execution times (for file processing)
- Error rates

## Troubleshooting

### Files not loading

1. Check CDN URL format:
   ```bash
   # Should be:
   https://files.sevenstime.com/materials/token/files/image.png

   # NOT:
   http://localstack:4566/sevenstime-materials/materials/...
   ```

2. Check Cloudflare DNS is proxied (orange cloud)
3. Verify S3 bucket permissions
4. Check CORS configuration

### Cache not working

1. Check response headers:
   ```bash
   curl -I https://files.sevenstime.com/materials/test.jpg
   # Should see: cf-cache-status: HIT
   ```

2. Purge cache in Cloudflare dashboard if needed
3. Verify Page Rules are active

### CORS errors

Update S3 bucket CORS policy to include your domain:
```json
{
    "AllowedOrigins": ["https://sevenstime.com", "https://files.sevenstime.com"]
}
```

## Migration from Local Storage

If you previously stored files locally in `public/storage/files`:

1. Upload existing files to S3:
   ```bash
   aws s3 sync public/storage/files/materials/ s3://sevenstime-materials/materials/
   ```

2. Update database `materials.logo` column to use S3 keys instead of filenames

3. Run migration script to update `materials.files` JSON column

4. Keep local files as backup until confirmed working

## Alternative: CloudFront Instead of Cloudflare

If you prefer AWS CloudFront:

1. Create CloudFront distribution pointing to S3 bucket
2. Update `.env`:
   ```env
   CDN_BASE_URL=https://d123456.cloudfront.net
   CDN_ENABLED=true
   ```

CloudFront provides similar benefits but is AWS-native.