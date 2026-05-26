# Sevens Platform

A comprehensive blockchain-based platform for digital material tokenization, publishing, and trading built on the Solana network. This full-stack web application demonstrates advanced blockchain integration, decentralized file storage, and modern web development practices.

## Project Overview

The Sevens Platform is a sophisticated web application that enables users to create, manage, and trade digital assets as blockchain tokens. The platform provides a complete ecosystem for tokenizing digital materials like images, documents, and other digital content, with built-in marketplace functionality for buying and selling tokens.

### Key Features

- **Token Creation & Management**: Create blockchain tokens representing digital materials
- **Digital Material Publishing**: Upload, validate, and publish digital content linked to tokens
- **Marketplace Functionality**: Buy, sell, and trade tokens with integrated pricing
- **Wallet Integration**: Connect with Phantom and other Solana wallets
- **File Storage & CDN**: AWS S3 integration with Lambda-based file processing
- **Real-time Updates**: WebSocket connections for live price feeds and updates
- **Multi-language Support**: International localization support
- **Administrative Dashboard**: Complete admin interface for platform management

## Architecture & Technology Stack

### Backend Technologies
- **PHP 8.3** with **Symfony 7.2** framework
- **MySQL** database with Doctrine ORM
- **Node.js/Express** server for blockchain operations
- **AWS S3** for file storage with **Lambda** functions for processing
- **Docker** containerization for development and deployment

### Frontend Technologies
- **React 18** with modern hooks and functional components
- **TypeScript** for type-safe development
- **Redux** for state management
- **Bootstrap 5** with custom SCSS styling
- **Webpack Encore** for asset compilation

### Blockchain Integration
- **Solana** blockchain integration via **@solana/web3.js**
- **Anchor Framework** for smart contract interactions
- **SPL Token** program integration
- **Metaplex** for NFT metadata handling
- **Wallet adapters** for multiple wallet providers

### Infrastructure
- **Docker Compose** for local development
- **LocalStack** for AWS services emulation
- **Nginx** web server with SSL support
- **WebSocket** connections for real-time features

## Screenshots

### Token Creation Interface
![Create Token](doc/images/Create%20token.png)

The token creation interface allows users to upload digital materials and mint them as blockchain tokens with comprehensive metadata.

### Created Token Display
![Created Token](doc/images/Created%20token.png)

Displays the successfully created token with blockchain verification and material preview.

### Token Container Verification
![Check Token Container](doc/images/Check%20token%20container.png)

Verification system for uploaded material containers with hash validation and integrity checking.

### Material Publishing
![Publish Material](doc/images/Publish%20material.png)

Publishing interface for making tokenized materials available on the platform marketplace.

### Material Claiming
![Claim Material](doc/images/Claim%20material.png)

Interface for users to claim ownership of purchased materials and download associated files.

### Token Marketplace
![Buy Token](doc/images/Buy%20token.png)

Marketplace interface for discovering and purchasing available tokens with pricing information.

### Management Interfaces
![Materials Management](doc/images/Materials%20management.png)

Administrative interface for managing multiple materials and their associated tokens.

![Material Management](doc/images/Material%20management.png)

Individual material management with editing capabilities and status tracking.

![Token Sales Management](doc/images/Token%20sales%20management.png)

Sales management interface with pricing controls and transaction history.

### Blockchain Integration
![Token Data in Solana Explorer](doc/images/Token%20data%20in%20Solana%20blockchain%20explorer.png)

Integration with Solana blockchain explorer showing token data and verification.

![Token Transactions](doc/images/Token%20transactions%20blockchain%20data.png)

Blockchain transaction history and verification data for token operations.

![Token Metaplex Data](doc/images/Token%20Metaplex%20data.png)

Metaplex metadata integration showing NFT standard compliance and token metadata stored on-chain.

## Live Demo Token

Experience the Sevens Platform in action through our demonstration token deployed on Solana Devnet:

**[Permanent Sevens Token](https://explorer.solana.com/address/5tZjU48ZNzue6N6kMmuhh8bo1QSHYSF159aQ9s18sg3Y?cluster=devnet)**

- **Token Address**: `5tZjU48ZNzue6N6kMmuhh8bo1QSHYSF159aQ9s18sg3Y`
- **Owner Wallet**: `4DWMssnVi5eHuGkDfu6YhsHfWeS3ZQcyeyJf4VtWZ2gY`
- **Created**: May 25, 2024
- **Status**: Active demonstration token with verified metadata and hash validation

This permanent token showcases the complete workflow of digital material tokenization, from creation to blockchain verification. It demonstrates secure asset creation, metadata validation, and integration with Solana's SPL Token and Metaplex standards.

## System Architecture

### Application Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Symfony       │    │   Node.js       │
│   React/Redux   │◄──►│   Backend       │◄──►│   Blockchain    │
│                 │    │                 │    │   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Wallet   │    │   MySQL         │    │   Solana        │
│   (Phantom)     │    │   Database      │    │   Blockchain    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3 +      │
                       │   Lambda        │
                       └─────────────────┘
```

### Data Flow

1. **User Authentication**: Wallet-based authentication with signature verification
2. **Material Upload**: Direct browser-to-S3 upload with presigned URLs
3. **Blockchain Interaction**: Token creation and management via Solana programs
4. **File Processing**: Lambda functions validate and process uploaded materials
5. **Real-time Updates**: WebSocket connections for live data synchronization

## Getting Started

### Prerequisites

- **Docker & Docker Compose**: For containerized development
- **Node.js 20+**: For frontend asset compilation
- **PHP 8.3+**: For backend development
- **MySQL 8+**: Database server
- **Git**: Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anatolii-semochko/sevens-platform.git
   cd sevens-platform
   ```

2. **Environment Configuration**
   ```bash
   cp .env.dist .env
   # Edit .env with your configuration values
   ```

3. **Start Docker Services**
   ```bash
   make up
   ```

4. **Install Dependencies**
   ```bash
   # PHP dependencies
   make composer-install

   # Node.js dependencies
   make yarn-install
   ```

5. **Database Setup**
   ```bash
   # Run database migrations
   make migration-migrate

   # Load sample data (optional)
   make fixtures-load
   ```

6. **Build Frontend Assets**
   ```bash
   make encore-dev
   ```

### Development Environment

The application runs on:
- **Web Interface**: https://sevenstime.local:8444
- **API Endpoints**: https://sevenstime.local:8444/api
- **Node.js Server**: http://localhost:3000
- **Database**: localhost:3307

### SSL Certificate Setup

Generate local SSL certificates:
```bash
mkcert sevenstime.local "*.sevenstime.local" localhost 127.0.0.1 ::1
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Token Management

- `POST /api/token/create` - Create new blockchain token
- `GET /api/token/{publicKey}` - Retrieve token information
- `PATCH /api/token/{publicKey}` - Update token metadata
- `DELETE /api/token/{publicKey}` - Remove token (if conditions met)

### Material Management

- `POST /api/material/create` - Create material linked to token
- `GET /api/material/{tokenKey}` - Get material details
- `PATCH /api/material/{tokenKey}` - Update material information
- `POST /api/material/presigned-upload-url` - Get S3 upload URL
- `GET /api/material/{tokenKey}/archive-status` - Check processing status

### Marketplace

- `GET /api/marketplace/materials` - List available materials
- `POST /api/marketplace/buy` - Purchase token
- `GET /api/marketplace/sales` - View sales history

## Database Schema

### Core Entities

**Materials**
- Token integration with blockchain verification
- File storage metadata and processing status
- Publishing and marketplace information

**Tokens**
- Blockchain token references and metadata
- Ownership and transaction history
- Pricing and marketplace status

**Users**
- Wallet-based authentication
- Role and permission management
- Activity and transaction history

## Testing

### Running Tests

```bash
# PHP Unit Tests
make test-php

# Frontend Tests
make test-js

# Integration Tests
make test-integration
```

### Test Coverage

The application includes comprehensive test coverage for:
- API endpoints and business logic
- Blockchain integration functionality
- File upload and processing workflows
- User authentication and authorization

## Deployment

### Production Environment

1. **AWS Infrastructure Setup**
   ```bash
   # Configure AWS credentials
   aws configure

   # Deploy S3 buckets and Lambda functions
   ./deploy/aws-setup.sh
   ```

2. **Database Migration**
   ```bash
   php bin/console doctrine:migrations:migrate --env=prod
   ```

3. **Asset Compilation**
   ```bash
   yarn encore production
   ```

4. **SSL Certificate Configuration**
   - Configure SSL certificates for production domain
   - Update environment variables for production URLs

### Environment Variables

Key production environment variables:

```bash
APP_ENV=prod
APP_SECRET=your-production-secret
DATABASE_URL=mysql://user:pass@host:port/database
AWS_S3_BUCKET=your-production-bucket
AWS_LAMBDA_FUNCTION=material-validator-prod
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com
```

## Performance Considerations

### Optimization Features

- **CDN Integration**: CloudFlare integration for static asset delivery
- **Database Indexing**: Optimized queries with proper indexing
- **Caching Strategy**: Redis caching for frequently accessed data
- **Asset Optimization**: Webpack optimization for production builds
- **Image Processing**: Lambda-based image optimization and resizing

### Scalability

- **Horizontal Scaling**: Docker-based architecture supports horizontal scaling
- **Database Optimization**: Connection pooling and query optimization
- **CDN Distribution**: Global content distribution for improved performance
- **Microservices**: Separated Node.js service for blockchain operations

## Security Features

### Blockchain Security
- **Wallet Signature Verification**: All transactions require wallet signatures
- **Smart Contract Integration**: Secure interaction with audited Solana programs
- **Hash Validation**: File integrity verification using SHA-256 hashes

### Application Security
- **CSRF Protection**: Cross-site request forgery protection
- **Input Validation**: Comprehensive input sanitization and validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **SSL/TLS**: HTTPS encryption for all communications

### File Security
- **Presigned URLs**: Time-limited, secure file upload URLs
- **Lambda Validation**: Server-side file validation and processing
- **Access Control**: Fine-grained access control for file operations

## Contributing

### Development Guidelines

1. **Code Standards**: Follow PSR-12 for PHP and ESLint for JavaScript
2. **Testing**: All new features require accompanying tests
3. **Documentation**: Update documentation for new features and APIs
4. **Security**: Security review required for blockchain-related changes

### Branch Strategy

- `main`: Production-ready code
- `development`: Integration branch for new features
- `feature/*`: Individual feature development
- `hotfix/*`: Critical bug fixes

## Sevens Ecosystem

The Sevens platform consists of four interconnected projects that work together to provide a complete blockchain tokenization solution:

### **[Sevens Backoffice](https://github.com/anatolii-semochko/sevens-backoffice)**
*Administrative control center and revenue management platform*
- **Technology**: PHP/Symfony, React/Redux, MySQL, Docker
- **Purpose**: Administrative dashboard for token operations monitoring, fee configuration, user management, and financial analytics
- **Key Features**: Real-time transaction monitoring, emergency system controls, tariff management, comprehensive reporting

### **[Sevens Platform](https://github.com/anatolii-semochko/sevens-platform)**
*Main user-facing application for digital material tokenization and trading*
- **Technology**: PHP/Symfony, React/TypeScript, MySQL, AWS S3, Docker
- **Purpose**: Complete web platform for creating, managing, and trading blockchain tokens representing digital materials
- **Key Features**: Token creation & management, marketplace functionality, wallet integration, file storage & CDN

### **[Sevens Smart Contracts](https://github.com/anatolii-semochko/sevens-smartcontracts)**
*Enterprise-grade NFT marketplace infrastructure built on Solana*
- **Technology**: Rust, Anchor Framework, Solana blockchain
- **Purpose**: Dual-contract token ecosystem with hash-validated NFTs and built-in marketplace functionality
- **Key Features**: Hash-based uniqueness validation, dynamic fee collection, inter-contract communication, governance layer

### **[Sevens Wallet React](https://github.com/anatolii-semochko/custom-solana-wallet-react)**
*Custom Solana wallet interface library with extended functionality*
- **Technology**: React, TypeScript, Solana Web3.js, CryptoJS
- **Purpose**: Comprehensive React library for building custom wallet interfaces compatible with Phantom API
- **Key Features**: Multi-language support, encrypted storage, transaction validation, modular architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SEVENS ECOSYSTEM                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   BACKOFFICE    │    │    PLATFORM     │    │   WALLET     │ │
│  │   (Admin)       │◄──►│  (User App)     │◄──►│  (Library)   │ │
│  │ • Fee Config    │    │ • Token Trading │    │ • UI Comps   │ │
│  │ • Monitoring    │    │ • Marketplace   │    │ • Security   │ │
│  │ • Analytics     │    │ • File Storage  │    │ • Multi-lang │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                        │                    │       │
│           │                        │                    │       │
│           └────────────────────────┼────────────────────┘       │
│                                    │                            │
│                    ┌───────────────▼───────────────┐            │
│                    │        SMART CONTRACTS        │            │
│                    │         (Blockchain)          │            │
│                    │ • Token Operations            │            │
│                    │ • Marketplace Logic           │            │
│                    │ • Fee Collection              │            │
│                    │ • Hash Validation             │            │
│                    └───────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

This integrated ecosystem provides a complete solution for blockchain-based digital asset tokenization, from smart contract infrastructure to user interfaces and administrative tools.

## Contact

**Anatolii Semochko**
- LinkedIn: [linkedin.com/in/anatolii-semochko](https://linkedin.com/in/anatolii-semochko)
- GitHub: [github.com/anatolii-semochko](https://github.com/anatolii-semochko)
- Email: anatoliy.semochko@gmail.com

## License

This project is proprietary software developed for educational and portfolio demonstration purposes.

## Acknowledgments

This project demonstrates advanced full-stack development capabilities including:
- Modern PHP/Symfony backend development
- React/TypeScript frontend development
- Blockchain integration and smart contract interactions
- Cloud infrastructure and microservices architecture
- DevOps practices with Docker and CI/CD
- Security best practices for web3 applications

The Sevens Platform showcases the integration of traditional web development with cutting-edge blockchain technology, providing a comprehensive solution for digital asset tokenization and marketplace functionality.