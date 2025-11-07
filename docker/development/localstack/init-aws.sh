#!/bin/bash

echo "Initializing LocalStack AWS services..."

# Wait for LocalStack to be ready
sleep 5

# Set AWS endpoint
export AWS_ENDPOINT=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1

# Create S3 bucket for materials
echo "Creating S3 bucket: sevenstime-materials..."
awslocal s3 mb s3://sevenstime-materials

# Enable CORS for the bucket
echo "Configuring CORS for bucket..."
awslocal s3api put-bucket-cors --bucket sevenstime-materials --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# Set bucket policy for public read (for CDN-like access)
echo "Setting bucket policy..."
awslocal s3api put-bucket-policy --bucket sevenstime-materials --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sevenstime-materials/*"
    }
  ]
}'

echo "S3 bucket created and configured successfully!"

# Deploy Lambda function for material validation
echo "Deploying Lambda function: material-zip-validator..."

# Package Lambda function
cd /app/lambda/material-validator
zip -r /tmp/function.zip handler.py

# Create Lambda function
awslocal lambda create-function \
  --function-name material-zip-validator \
  --runtime python3.11 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler handler.lambda_handler \
  --zip-file fileb:///tmp/function.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{AWS_ACCESS_KEY_ID=test,AWS_SECRET_ACCESS_KEY=test,AWS_ENDPOINT_URL=http://localstack:4566,S3_BUCKET=sevenstime-materials}"

# Clean up
rm /tmp/function.zip

echo "✅ Lambda function deployed successfully!"

echo "LocalStack initialization complete!"
echo "S3 endpoint: http://localstack:4566"
echo "S3 Bucket: sevenstime-materials"
echo "Lambda function: material-zip-validator"