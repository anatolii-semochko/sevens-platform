"""
Lambda function to validate and process material ZIP archives with image optimization.

This function:
1. Downloads ZIP file from S3
2. Validates ZIP structure and contents
3. Extracts all files from archive
4. Generates optimized image variants (thumbnail 300px, preview 1200px) for images
5. Returns list of valid files with metadata and CDN keys

Image files get 3 variants: original, preview (1200px), thumbnail (300px)
Non-image files only get the original version
"""

import json
import zipfile
import io
import os
import hashlib
import boto3
from typing import Dict, List, Any, Optional
from PIL import Image

# Initialize S3 client
s3_client = boto3.client(
    's3',
    endpoint_url=os.environ.get('AWS_ENDPOINT', 'http://localstack:4566'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', 'test'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', 'test')
)

# Configuration
MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_FILE_SIZE = 20 * 1024 * 1024   # 20 MB per file
MAX_FILES = 100  # Maximum number of files to extract and upload

# Image optimization settings
THUMBNAIL_MAX_SIZE = 300  # Max dimension for thumbnails (list display)
PREVIEW_MAX_SIZE = 1200   # Max dimension for preview (gallery display)
JPEG_QUALITY = 85         # JPEG quality for optimized images

# Supported image types for variant generation
IMAGE_TYPES = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler function.

    Expected event structure:
    {
        "bucket": "sevenstime-materials",
        "key": "materials/abc123/archive.zip",
        "materialToken": "abc123"
    }

    Returns:
    {
        "success": True/False,
        "status": "validated"/"failed",
        "files": [{"key": "...", "name": "...", "size": ..., "type": "..."}],
        "error": "error message" (if failed)
    }
    """

    try:
        # Extract parameters from event
        bucket = event.get('bucket')
        key = event.get('key')
        material_token = event.get('materialToken')
        container_metadata = event.get('containerMetadata')

        if not bucket or not key or not material_token:
            return create_error_response('Missing required parameters: bucket, key, or materialToken')

        print(f"Processing ZIP archive: s3://{bucket}/{key}")

        # Extract expected container parameters if provided
        expected_hash = None
        expected_size = None
        expected_name = None
        validate_only = False
        if container_metadata:
            expected_hash = container_metadata.get('hash')
            expected_size = container_metadata.get('size')
            expected_name = container_metadata.get('name')
            validate_only = container_metadata.get('validateOnly', False)
            print(f"Container validation enabled - hash: {expected_hash}, size: {expected_size}, validateOnly: {validate_only}")

        # Download ZIP from S3
        try:
            response = s3_client.get_object(Bucket=bucket, Key=key)
            zip_content = response['Body'].read()
            zip_size = len(zip_content)

            print(f"Downloaded ZIP file, size: {zip_size} bytes")

            # VALIDATE CONTAINER SIZE (if provided)
            if expected_size is not None and zip_size != expected_size:
                return create_error_response(
                    f'Container size mismatch: uploaded {zip_size} bytes, '
                    f'but blockchain expects {expected_size} bytes. '
                    f'File has been modified or is not the same container.'
                )

            # VALIDATE CONTAINER HASH (if provided) - CRITICAL SECURITY CHECK
            if expected_hash:
                actual_hash = calculate_file_hash(zip_content)
                print(f"Calculated hash of uploaded file: {actual_hash}")

                if actual_hash != expected_hash:
                    return create_error_response(
                        f'Container hash mismatch: uploaded file hash does not match blockchain-validated hash. '
                        f'This file is NOT the same container that was validated. '
                        f'Expected: {expected_hash}, Got: {actual_hash}'
                    )

                print("✓ Container verification passed: hash and size match blockchain data")

            # Validate ZIP size limit
            if zip_size > MAX_ZIP_SIZE:
                return create_error_response(
                    f'ZIP file too large: {zip_size} bytes (max: {MAX_ZIP_SIZE} bytes)'
                )

        except Exception as e:
            return create_error_response(f'Failed to download ZIP from S3: {str(e)}')

        # If validation-only mode, return success after hash/size validation
        if validate_only:
            print("Validation-only mode: Skipping file extraction")
            return {
                'success': True,
                'status': 'validated',
                'message': 'Container validation successful (hash and size verified)'
            }

        # Validate and extract ZIP contents
        files = []

        try:
            with zipfile.ZipFile(io.BytesIO(zip_content), 'r') as zip_ref:
                # Check if ZIP is valid
                if zip_ref.testzip() is not None:
                    return create_error_response('ZIP file is corrupted')

                file_list = zip_ref.namelist()
                print(f"ZIP contains {len(file_list)} files")

                # Process each file in ZIP
                for file_name in file_list:
                    # Skip directories and hidden/system files
                    if file_name.endswith('/') or file_name.startswith('.') or '/__MACOSX' in file_name:
                        continue

                    file_info = zip_ref.getinfo(file_name)
                    file_size = file_info.file_size
                    file_ext = os.path.splitext(file_name)[1].lower()

                    # Validate file size (skip files that are too large)
                    if file_size > MAX_FILE_SIZE:
                        print(f"Skipping large file: {file_name} ({file_size} bytes, max: {MAX_FILE_SIZE})")
                        continue

                    # Extract file content
                    file_content = zip_ref.read(file_name)
                    base_name = os.path.basename(file_name)
                    file_type = file_ext[1:] if file_ext else 'unknown'  # Remove leading dot

                    # Upload original file to original/ subfolder
                    original_key = f"materials/{material_token}/files/original/{base_name}"

                    try:
                        s3_client.put_object(
                            Bucket=bucket,
                            Key=original_key,
                            Body=file_content,
                            ContentType=get_content_type(file_ext)
                        )

                        file_entry = {
                            'key': original_key,
                            'name': base_name,
                            'size': file_size,
                            'type': file_type
                        }

                        print(f"Uploaded original: {original_key}")

                        # Generate image variants if file is an image
                        if file_ext in IMAGE_TYPES:
                            try:
                                process_image_variants(
                                    bucket=bucket,
                                    material_token=material_token,
                                    base_name=base_name,
                                    image_data=file_content,
                                    file_entry=file_entry
                                )
                            except Exception as e:
                                print(f"Warning: Failed to generate variants for {base_name}: {str(e)}")
                                # Continue without variants - original is still available

                        files.append(file_entry)

                    except Exception as e:
                        print(f"Failed to upload file {base_name}: {str(e)}")
                        continue

                    # Check max files limit
                    if len(files) >= MAX_FILES:
                        print(f"Reached maximum files limit ({MAX_FILES})")
                        break

        except zipfile.BadZipFile:
            return create_error_response('Invalid ZIP file format')
        except Exception as e:
            return create_error_response(f'Failed to process ZIP file: {str(e)}')

        # Validate that we found at least one file
        if not files:
            return create_error_response('No valid files found in ZIP archive')

        print(f"Successfully processed {len(files)} files")

        # Return success response
        return {
            'success': True,
            'status': 'validated',
            'files': files,
            'totalFiles': len(files)
        }

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return create_error_response(f'Internal error: {str(e)}')


def calculate_file_hash(file_content: bytes) -> str:
    """
    Calculate SHA-256 hash of file content.
    Returns hex string (64 characters).
    """
    return hashlib.sha256(file_content).hexdigest()


def create_error_response(error_message: str) -> Dict[str, Any]:
    """Create standardized error response."""
    return {
        'success': False,
        'status': 'failed',
        'error': error_message,
        'files': []
    }


def process_image_variants(bucket: str, material_token: str, base_name: str,
                          image_data: bytes, file_entry: Dict[str, Any]) -> None:
    """
    Generate and upload image variants (thumbnail and preview).

    Args:
        bucket: S3 bucket name
        material_token: Material token for S3 path
        base_name: File name
        image_data: Original image bytes
        file_entry: File metadata dict to update with variant keys
    """
    # Open image
    img = Image.open(io.BytesIO(image_data))

    # Convert RGBA/LA/P to RGB for JPEG compatibility
    if img.mode in ('RGBA', 'LA', 'P'):
        # Create white background
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        # Paste with alpha channel as mask
        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
        img = background

    # Store original dimensions
    file_entry['width'] = img.width
    file_entry['height'] = img.height

    # Generate thumbnail (300px max dimension)
    thumbnail_data = resize_image(img, THUMBNAIL_MAX_SIZE)
    thumbnail_key = f"materials/{material_token}/files/thumbnail/{base_name}"
    s3_client.put_object(
        Bucket=bucket,
        Key=thumbnail_key,
        Body=thumbnail_data,
        ContentType='image/jpeg'
    )
    file_entry['keyThumbnail'] = thumbnail_key
    print(f"  ✓ Generated thumbnail: {thumbnail_key}")

    # Generate preview (1200px max dimension)
    preview_data = resize_image(img, PREVIEW_MAX_SIZE)
    preview_key = f"materials/{material_token}/files/preview/{base_name}"
    s3_client.put_object(
        Bucket=bucket,
        Key=preview_key,
        Body=preview_data,
        ContentType='image/jpeg'
    )
    file_entry['keyPreview'] = preview_key
    print(f"  ✓ Generated preview: {preview_key}")


def resize_image(img: Image.Image, max_size: int) -> bytes:
    """
    Resize image maintaining aspect ratio.

    Args:
        img: PIL Image object
        max_size: Maximum dimension (width or height)

    Returns:
        JPEG image bytes
    """
    # Create copy to avoid modifying original
    img_copy = img.copy()

    # Resize maintaining aspect ratio (Pillow 10+ uses Image.Resampling.LANCZOS)
    img_copy.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

    # Save as optimized JPEG
    output = io.BytesIO()
    img_copy.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    return output.getvalue()


def get_content_type(file_extension: str) -> str:
    """Get MIME type for file extension."""
    content_types = {
        # Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        # Videos
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        # Audio
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
        '.m4a': 'audio/mp4',
        # Documents
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.rtf': 'application/rtf',
        # Archives
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        # Code/Text
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.md': 'text/markdown',
        # 3D Models
        '.obj': 'model/obj',
        '.fbx': 'application/octet-stream',
        '.blend': 'application/octet-stream',
        '.glb': 'model/gltf-binary',
        '.gltf': 'model/gltf+json',
    }
    return content_types.get(file_extension.lower(), 'application/octet-stream')