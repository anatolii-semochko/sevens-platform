#!/bin/bash
# Deploy material-validator Lambda function to LocalStack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
ZIP_FILE="$SCRIPT_DIR/function.zip"

echo "🔨 Building Lambda function..."

# Clean previous build (use sudo for Docker-created files)
sudo rm -rf "$BUILD_DIR"
sudo rm -f "$ZIP_FILE"

# Create build directory
mkdir -p "$BUILD_DIR"

# Copy handler
cp "$SCRIPT_DIR/handler.py" "$BUILD_DIR/"

# Install dependencies using Docker Python container
echo "📦 Installing Python dependencies..."
docker run --rm -v "$SCRIPT_DIR:/lambda" -w /lambda \
  python:3.11-slim \
  bash -c "pip install -r requirements.txt -t build/ --quiet"

# Create ZIP
echo "📦 Creating deployment package..."
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . > /dev/null
cd "$SCRIPT_DIR"

echo "✅ Lambda package created: $ZIP_FILE"
echo "📦 Package size: $(du -h "$ZIP_FILE" | cut -f1)"

# Deploy via AWS CLI to LocalStack
echo "🚀 Deploying to LocalStack..."
FUNCTION_NAME="material-validator"
AWS_ENDPOINT="http://localhost:4566"

# Check if function exists
if docker compose exec -T localstack awslocal lambda get-function --function-name "$FUNCTION_NAME" 2>/dev/null; then
  echo "Updating existing function..."
  docker compose exec -T localstack awslocal lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb:///tmp/function.zip" 2>&1 | grep -v "InsecureRequestWarning" || true

  # Copy ZIP to localstack container first
  docker cp "$ZIP_FILE" "$(docker compose ps -q localstack):/tmp/function.zip"
  docker compose exec -T localstack awslocal lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb:///tmp/function.zip"
else
  echo "Creating new function..."
  # Copy ZIP to localstack container
  docker cp "$ZIP_FILE" "$(docker compose ps -q localstack):/tmp/function.zip"
  docker compose exec -T localstack awslocal lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime python3.11 \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --handler handler.lambda_handler \
    --zip-file "fileb:///tmp/function.zip" \
    --timeout 300 \
    --memory-size 512
fi

# Clean up (use sudo for Docker-created files)
sudo rm -rf "$BUILD_DIR"

echo "✅ Lambda deployment complete!"