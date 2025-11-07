"""
Lambda function to validate and process material ZIP archives.

This function:
1. Downloads ZIP file from S3
2. Validates ZIP structure and contents
3. Extracts all files from archive
4. Returns list of valid files with metadata
"""

import json
import zipfile
import io
import os
import hashlib
import boto3
from typing import Dict, List, Any

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
        if container_metadata:
            expected_hash = container_metadata.get('hash')
            expected_size = container_metadata.get('size')
            expected_name = container_metadata.get('name')
            print(f"Container validation enabled - hash: {expected_hash}, size: {expected_size}")

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

                    # Generate S3 key for extracted file
                    base_name = os.path.basename(file_name)
                    s3_file_key = f"materials/{material_token}/files/{base_name}"

                    # Upload file to S3
                    try:
                        s3_client.put_object(
                            Bucket=bucket,
                            Key=s3_file_key,
                            Body=file_content,
                            ContentType=get_content_type(file_ext)
                        )

                        files.append({
                            'key': s3_file_key,
                            'name': base_name,
                            'size': file_size,
                            'type': file_ext[1:] if file_ext else 'unknown'  # Remove leading dot
                        })

                        print(f"Uploaded file: {s3_file_key}")

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