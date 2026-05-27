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
│    Frontend     │    │     Symfony     │    │     Node.js     │
│   React/Redux   │◄──►│     Backend     │◄──►│    Blockchain   │
│                 │    │                 │    │     Server      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Wallet   │    │      MySQL      │    │      Solana     │
│    (Phantom)    │    │     Database    │    │    Blockchain   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     AWS S3 +    │
                       │     Lambda      │
                       └─────────────────┘
```

### Data Flow

1. **User Authentication**: Wallet-based authentication with signature verification
2. **Material Upload**: Direct browser-to-S3 upload with presigned URLs
3. **Blockchain Interaction**: Token creation and management via Solana programs
4. **File Processing**: Lambda functions validate and process uploaded materials
5. **Real-time Updates**: WebSocket connections for live data synchronization

## Platform Architecture Overview

The Sevens Platform implements sophisticated token management workflows that integrate traditional web technologies with blockchain infrastructure. Each token operation involves multiple systems working in coordination: Symfony backend, React frontend, Node.js blockchain server, AWS services, and Solana blockchain.

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                            SEVENS PLATFORM ARCHITECTURE                           │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐
│    FRONTEND     │    │     SYMFONY     │    │     NODE.JS     │    │     AWS      │
│   (React/TS)    │    │     BACKEND     │    │     SERVER      │    │   SERVICES   │
│                 │    │                 │    │                 │    │              │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌──────────┐ │
│ │ Token UI    │◄├────┤►│ Token API   │◄├────┤►│ Blockchain  │ │    │ │ S3       │ │
│ │ Material UI │ │    │ │ Material    │ │    │ │ Integration │ │    │ │ Storage  │ │
│ │ Wallet      │ │    │ │ Services    │ │    │ │ Services    │ │    │ │ Lambda   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │    │ │ CDN      │ │
└─────────────────┘    └─────────────────┘    └─────────────────┘    │ └──────────┘ │
         │                      │                      │             └──────────────┘
         │                      │                      │                     │
         ▼                      ▼                      ▼                     │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│   User Wallet   │    │ MySQL Database  │    │ Solana Network  │            │
│   (Phantom)     │    │ - Materials     │    │ - Token Mint    │            │
│ - Sign TX       │    │ - Tokens        │    │ - Metadata      │            │
│ - Verify Own    │    │ - Users         │    │ - Transactions  │            │
└─────────────────┘    │ - Transactions  │    └─────────────────┘            │
                       └─────────────────┘                                   │
                                │                                            │
                                └────────────────────────────────────────────┘
```

## Technical Workflows

For detailed technical documentation of token operations, see **[Technical Workflows Documentation](TECHNICAL_WORKFLOWS.md)** which includes:

### **Token Minting (Creation) Workflow**

#### Process Overview

Token minting transforms digital materials into blockchain-verified tokens with immutable metadata and file integrity validation.

#### Architecture Diagram

```
Phase 1: METADATA INPUT     Phase 2: FILE UPLOAD    Phase 3: TX GENERATION    Phase 4: SIGNING & MINT
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │    FRONTEND     │       │     AWS S3      │       │    NODE.JS      │       │     SOLANA      │
  │                 │       │                 │       │                 │       │                 │
  │ 1. User enters  │   2.  │ 3. File upload  │   4.  │ 5. Generate     │   6.  │ 7. Mint token   │
  │    metadata  ───┼───────┤    with hash ───┼───────┤    mint TX   ───┼───────┤    on-chain     │
  │ • Name          │       │    validation   │       │ • Query state   │       │ • Create mint   │
  │ • Description   │       │ • SHA-256       │       │ • Build TX      │       │ • Set metadata  │
  │ • Author        │       │ • Size check    │       │ • Store temp    │       │ • Assign owner  │
  │ • File hash     │       │ • Lambda proc   │       │ • Return TX ID  │       │ • Confirm TX    │
  └─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

#### Detailed Technical Flow

```mermaid
sequenceDiagram
    participant UI as Frontend UI<br/>(React/TypeScript)
    participant Wallet as User Wallet<br/>(Phantom/Solflare)
    participant API as Symfony API<br/>(PHP/Doctrine)
    participant NodeJS as Node.js Server<br/>(Blockchain Service)
    participant S3 as AWS S3<br/>(File Storage)
    participant Lambda as AWS Lambda<br/>(File Processor)
    participant BC as Solana Network<br/>(Blockchain)

    Note over UI,BC: Phase 1: Metadata Input & Validation
    UI->>UI: 1. User fills token creation form<br/>- Name, Author, Description<br/>- File selection<br/>- Hash calculation (SHA-256)

    UI->>Wallet: 2. Connect wallet for<br/>authority verification
    Wallet-->>UI: Wallet connected<br/>(PublicKey obtained)

    Note over UI,BC: Phase 2: File Upload & Validation
    UI->>API: 3. POST /api/material/presigned-upload-url<br/>{fileName, fileSize, fileHash, tokenKey}
    API->>S3: 4. Generate presigned URL<br/>with checksum validation
    S3-->>API: Presigned URL with metadata
    API-->>UI: Upload URL + validation params

    UI->>S3: 5. Direct file upload<br/>with SHA-256 checksum
    S3->>Lambda: 6. Trigger validation function<br/>on file upload event
    Lambda->>Lambda: 7. Validate file integrity<br/>- Hash verification<br/>- File type validation<br/>- Malware scanning
    Lambda-->>S3: Validation result stored

    Note over UI,BC: Phase 3: Token Mint Transaction Generation
    UI->>API: 8. GET /api/token/{mintPublicKey}/mint<br/>{authorityPublicKey, metadata}
    API->>NodeJS: 9. GET /manage/mint-transaction<br/>Create unsigned mint transaction

    NodeJS->>BC: 10. Query token management PDA<br/>Check if mint authority exists
    BC-->>NodeJS: Authority validation result

    NodeJS->>NodeJS: 11. Build mint transaction:<br/>- create_mint() instruction<br/>- initialize_metadata()<br/>- Set mint authority<br/>- Calculate fees

    NodeJS->>API: 12. Store transaction for verification<br/>INSERT INTO wallet_transactions
    API-->>NodeJS: Transaction ID generated

    NodeJS-->>API: 13. Return {transaction, transactionId}
    API-->>UI: Unsigned transaction ready

    Note over UI,BC: Phase 4: Signing & Blockchain Execution
    UI->>UI: 14. Deserialize transaction<br/>Transaction.from(Buffer)

    UI->>Wallet: 15. Request signature<br/>wallet.signTransaction(tx)
    Wallet->>Wallet: User approves mint operation
    Wallet-->>UI: Signed transaction

    UI->>API: 16. POST /api/token/{token}/mint<br/>{transactionId, signature, metadata}

    API->>API: 17. Verify transaction integrity<br/>WalletService::matchTransactionSignature

    API->>NodeJS: 18. POST /send-signed-transaction<br/>{signature}
    NodeJS->>BC: 19. Broadcast to blockchain<br/>connection.sendRawTransaction

    BC->>BC: 20. Execute mint instruction:<br/>- Create token mint<br/>- Initialize metadata PDA<br/>- Set mint authority<br/>- Emit mint event

    BC-->>NodeJS: Transaction confirmed
    NodeJS-->>API: Mint success + token address

    Note over UI,BC: Phase 5: Database Recording & UI Update
    API->>API: 21. Create SevensToken entity<br/>- mintPublicKey<br/>- metadata<br/>- creator wallet<br/>- creation timestamp

    API->>API: 22. Record in ManageTransaction<br/>- TOKEN_MINT type<br/>- fee amount<br/>- target wallet

    API-->>UI: 23. Success response with token data
    UI->>UI: 24. Update UI: show created token<br/>navigate to token details page
```

**[→ View Implementation Details, Code Examples & Security Features](TECHNICAL_WORKFLOWS.md#1-token-minting-creation-workflow)**

### **Material Publishing/Listing Workflow**

#### Process Overview

Material publishing transforms blockchain tokens into discoverable, purchasable digital materials with rich metadata, file processing, and marketplace integration.

#### Architecture Diagram

```
Phase 1: TOKEN VALIDATION   Phase 2: FILE PROCESSING  Phase 3: MATERIAL CREATION    Phase 4: MARKETPLACE
   ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
   │   BLOCKCHAIN    │        │   AWS SERVICES  │        │    DATABASE     │        │   CDN/PUBLIC    │
   │                 │        │                 │        │                 │        │                 │
   │ 1. Verify token │   2.   │ 3. Process      │   4.   │ 5. Create       │   6.   │ 7. Serve        │
   │    exists    ───┼────────┤    archive   ───┼────────┤    material  ───┼────────┤    content      │
   │ • Read metadata │        │ • Extract files │        │ • Link token    │        │ • Thumbnails    │
   │ • Check owner   │        │ • Generate      │        │ • Set metadata  │        │ • Previews      │
   │ • Validate hash │        │   thumbnails    │        │ • Enable sales  │        │ • Full files    │
   │ • Get authority │        │ • Create CDN    │        │ • Publish live  │        │ • Global cache  │
   └─────────────────┘        └─────────────────┘        └─────────────────┘        └─────────────────┘
```

#### Detailed Technical Flow

```mermaid
sequenceDiagram
    participant UI as Frontend UI<br/>(React/TypeScript)
    participant Wallet as User Wallet<br/>(Phantom/Solflare)
    participant API as Symfony API<br/>(Material Service)
    participant NodeJS as Node.js Server<br/>(Blockchain Service)
    participant S3 as AWS S3<br/>(File Storage)
    participant Lambda as AWS Lambda<br/>(File Processor)
    participant BC as Solana Network<br/>(Token Data)
    participant CDN as CloudFlare CDN<br/>(Content Delivery)

    Note over UI,CDN: Phase 1: Token Validation & Ownership Verification
    UI->>UI: 1. User navigates to token<br/>- Select existing token<br/>- Input token public key<br/>- Connect wallet

    UI->>API: 2. POST /api/material/create<br/>{tokenKey, walletSignature}

    API->>NodeJS: 3. GET /token/{tokenKey}<br/>Fetch token data from blockchain
    NodeJS->>BC: 4. Query token metadata PDA<br/>Get immutable token data
    BC-->>NodeJS: Token metadata:<br/>- name, author, description<br/>- file hash, creation time<br/>- current owner

    NodeJS-->>API: 5. Token data with ownership info
    API->>API: 6. Verify wallet signature<br/>Confirm user owns token

    Note over UI,CDN: Phase 2: Archive Upload & File Processing
    API->>S3: 7. Generate presigned upload URL<br/>for material archive
    S3-->>API: Presigned URL with validation
    API-->>UI: Upload URL + requirements

    UI->>S3: 8. Upload material archive<br/>ZIP file containing digital materials
    S3->>Lambda: 9. Trigger processing function<br/>on archive upload event

    Lambda->>Lambda: 10. Process material archive:<br/>- Extract ZIP contents<br/>- Validate file hashes<br/>- Generate thumbnails<br/>- Create file manifest
    Lambda->>S3: 11. Store processed files<br/>- Original files<br/>- Thumbnail images<br/>- Preview files<br/>- Metadata JSON

    Lambda->>API: 12. WebSocket notification<br/>Processing complete with results
    API->>API: 13. Update processing status<br/>Mark as ready for publication

    Note over UI,CDN: Phase 3: Material Entity Creation
    API->>API: 14. Create Material entity<br/>- Link to blockchain token<br/>- Set metadata from token<br/>- Configure file paths<br/>- Set default pricing

    API->>API: 15. Process material metadata:<br/>- Parse archive contents<br/>- Extract preview images<br/>- Set category and tags<br/>- Configure visibility

    API->>CDN: 16. Invalidate CDN cache<br/>Prepare for new content distribution

    Note over UI,CDN: Phase 4: Marketplace Publication
    API->>API: 17. Activate material for sale<br/>- Set published status<br/>- Enable marketplace listing<br/>- Configure pricing options

    API-->>UI: 18. Material creation success<br/>with material ID and URLs

    UI->>UI: 19. Navigate to material page<br/>Display published material

    Note over UI,CDN: Phase 5: Content Delivery Setup
    UI->>CDN: 20. Request material content<br/>First user access
    CDN->>S3: 21. Fetch from origin<br/>if not cached
    S3-->>CDN: Original files + thumbnails
    CDN-->>UI: Optimized content delivery

    CDN->>CDN: 22. Cache optimization:<br/>- Global edge distribution<br/>- Automatic compression<br/>- Format optimization<br/>- Mobile-friendly delivery
```

**[→ View Implementation Details, Code Examples & Security Features](TECHNICAL_WORKFLOWS.md#2-material-publishinglisting-workflow)**

### **Token Purchasing (Buy) Workflow**

#### Process Overview

Token purchasing enables secure transfer of digital material ownership through blockchain-verified transactions with automatic payment processing, ownership updates, and marketplace commission handling.

#### Architecture Diagram

```
 Phase 1: MARKETPLACE     Phase 2: TRANSACTION       Phase 3: PAYMENT         Phase 4: OWNERSHIP
 ┌─────────────────┐      ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │    DISCOVERY    │      │   BLOCKCHAIN    │       │   SOL TRANSFER  │       │    DATABASE     │
 │                 │      │                 │       │                 │       │                 │
 │ 1. Browse       │  2.  │ 3. Generate     │   4.  │ 5. Execute      │   6.  │ 7. Update       │
 │    materials ───┼──────┤    buy TX    ───┼───────┤    payment   ───┼───────┤    ownership    │
 │ • Price check   │      │ • Validate sale │       │ • Transfer SOL  │       │ • Change owner  │
 │ • View content  │      │ • Build TX      │       │ • Platform fee  │       │ • Record sale   │
 │ • Check owner   │      │ • Set new owner │       │ • Seller payout │       │ • Price reset   │
 │ • Connect wallet│      │ • Store temp TX │       │ • Commission    │       │ • History log   │
 └─────────────────┘      └─────────────────┘       └─────────────────┘       └─────────────────┘
```

#### Detailed Technical Flow

```mermaid
sequenceDiagram
    participant UI as Frontend UI<br/>(React/TypeScript)
    participant Wallet as Buyer Wallet<br/>(Phantom/Solflare)
    participant API as Symfony API<br/>(Sale Service)
    participant NodeJS as Node.js Server<br/>(Blockchain Service)
    participant BC as Solana Network<br/>(Blockchain)
    participant DB as MySQL Database<br/>(Material Data)
    participant SellerWallet as Seller Wallet<br/>(Destination)

    Note over UI,SellerWallet: Phase 1: Material Discovery & Purchase Intent
    UI->>UI: 1. User browses marketplace<br/>- View available materials<br/>- Check prices and details<br/>- Select material to purchase

    UI->>API: 2. GET /api/material/{tokenKey}<br/>Fetch material details and pricing
    API->>DB: 3. Query material data<br/>- Current price<br/>- Owner information<br/>- Sale status<br/>- Token metadata
    DB-->>API: Material details with pricing
    API-->>UI: Material ready for purchase

    UI->>Wallet: 4. Connect buyer wallet<br/>for payment authorization
    Wallet-->>UI: Wallet connected<br/>(Buyer PublicKey)

    Note over UI,SellerWallet: Phase 2: Transaction Generation & Validation
    UI->>API: 5. GET /api/token/{token}/buy/{buyerPublicKey}<br/>Request buy transaction
    API->>API: 6. Validate purchase conditions:<br/>- Material is for sale<br/>- Price is set<br/>- Not self-purchase<br/>- Sufficient funds check

    API->>NodeJS: 7. GET /manage/buy-transaction<br/>Generate blockchain buy transaction
    NodeJS->>BC: 8. Query current token state<br/>- Verify current owner<br/>- Check token exists<br/>- Get metadata

    NodeJS->>NodeJS: 9. Build buy transaction:<br/>- Transfer token ownership<br/>- Calculate platform fees<br/>- Set payment amounts<br/>- Configure recipients

    NodeJS->>API: 10. Store transaction temporarily<br/>INSERT INTO wallet_transactions
    API-->>NodeJS: Transaction ID generated

    NodeJS-->>API: 11. Return unsigned transaction
    API-->>UI: Transaction ready for signing

    Note over UI,SellerWallet: Phase 3: Payment Execution & Verification
    UI->>UI: 12. Display purchase confirmation<br/>- Final price<br/>- Platform fees<br/>- Total amount<br/>- Seller information

    UI->>Wallet: 13. Request transaction signature<br/>wallet.signTransaction(buyTx)
    Wallet->>Wallet: User approves purchase<br/>- Confirm payment amount<br/>- Authorize token transfer<br/>- Sign transaction
    Wallet-->>UI: Signed transaction

    UI->>API: 14. POST /api/token/{token}/buy<br/>{transactionId, signature, buyerData}

    API->>API: 15. Verify transaction integrity<br/>WalletService::matchTransactionSignature

    API->>NodeJS: 16. POST /send-signed-transaction<br/>Submit to blockchain
    NodeJS->>BC: 17. Broadcast buy transaction<br/>connection.sendRawTransaction

    BC->>BC: 18. Execute payment transaction:<br/>- Transfer SOL to seller<br/>- Collect platform fees<br/>- Transfer token ownership<br/>- Update token metadata

    BC->>SellerWallet: 19. SOL payment transfer<br/>Minus platform commission
    BC-->>NodeJS: Transaction confirmed<br/>with new owner details

    NodeJS-->>API: 20. Purchase success confirmation<br/>with ownership update

    Note over UI,SellerWallet: Phase 4: Database Updates & Ownership Transfer
    API->>DB: 21. Update material ownership<br/>- Set new owner (buyer)<br/>- Reset sale price to 0<br/>- Update status to purchased<br/>- Record purchase timestamp

    API->>DB: 22. Create sale history record<br/>INSERT INTO material_sale_history<br/>- Previous owner<br/>- New owner<br/>- Sale price<br/>- Platform commission<br/>- Transaction hash

    API->>DB: 23. Record platform transaction<br/>INSERT INTO manage_transactions<br/>- TOKEN_BUY type<br/>- Fee collection<br/>- Commission tracking

    API-->>UI: 24. Purchase complete confirmation<br/>with new ownership details

    UI->>UI: 25. Navigate to owned material<br/>- Display purchase success<br/>- Show material access<br/>- Update user's collection

    Note over UI,SellerWallet: Phase 5: Post-Purchase Material Access
    UI->>API: 26. GET /api/material/{tokenKey}<br/>Access purchased material
    API->>API: 27. Verify new ownership<br/>Confirm buyer can access content

    API-->>UI: 28. Full material access granted<br/>- Download links<br/>- High-quality content<br/>- Complete file access
```

**[→ View Implementation Details, Code Examples & Security Features](TECHNICAL_WORKFLOWS.md#3-token-purchasing-buy-workflow)**

### **Token Burning/Claiming Workflow**

#### Process Overview

Token burning provides irreversible destruction of blockchain tokens with complete data cleanup, while claiming enables users to associate existing tokens with their platform accounts for material access and management.

#### Architecture Diagram

```
   BURN WORKFLOW:                          CLAIM WORKFLOW:                        CLEANUP WORKFLOW:
┌─────────────────┐                      ┌─────────────────┐                     ┌─────────────────┐
│   DESTRUCTION   │                      │   ASSOCIATION   │                     │   DATA REMOVAL  │
│                 │                      │                 │                     │                 │
│    Validate     │    Blockchain        │   Scan wallet   │    Database         │ 4. Clean files  │
│    ownership ───┼─── burn TX  ────┼───→│   for tokens ───┼─── updates ─────┼──→│ • Delete S3     │
│ • Check token   │   • Destroy     │    │ • Query chain   │   • Link user   │   │ • Remove DB     │
│ • Verify wallet │   • Remove mint │    │ • Verify owner  │   • Update mat  │   │ • Clear cache   │
│ • Confirm intent│   • Clear data  │    │ • Check claims  │   • Grant access│   │ • Purge CDN     │
│                 │   • Record TX   │    │                 │   • Bulk proc   │   └─────────────────┘
└─────────────────┘                      └─────────────────┘
```

#### Detailed Technical Flow - Token Burning

```mermaid
sequenceDiagram
    participant UI as Frontend UI<br/>(React/TypeScript)
    participant Wallet as Owner Wallet<br/>(Phantom/Solflare)
    participant API as Symfony API<br/>(Token Service)
    participant NodeJS as Node.js Server<br/>(Blockchain Service)
    participant BC as Solana Network<br/>(Blockchain)
    participant S3 as AWS S3<br/>(File Storage)
    participant CDN as CloudFlare CDN<br/>(Content Cache)

    Note over UI,CDN: Phase 1: Burn Intent & Validation
    UI->>UI: 1. User navigates to token burning<br/>- Select token to destroy<br/>- Understand permanence<br/>- Confirm destruction intent

    UI->>Wallet: 2. Connect wallet<br/>for ownership verification
    Wallet-->>UI: Wallet connected<br/>(Owner PublicKey)

    UI->>API: 3. GET /api/token/{token}/burn<br/>Request burn transaction
    API->>API: 4. Validate burn conditions:<br/>- User owns token<br/>- Token exists<br/>- No active claims<br/>- Confirm destructive action

    Note over UI,CDN: Phase 2: Blockchain Transaction Generation
    API->>NodeJS: 5. GET /manage/burn-transaction<br/>Generate burn transaction
    NodeJS->>BC: 6. Query token state<br/>- Verify existence<br/>- Check current owner<br/>- Get metadata

    NodeJS->>NodeJS: 7. Build burn transaction:<br/>- Close token account<br/>- Destroy mint<br/>- Reclaim rent<br/>- Clear metadata

    NodeJS->>API: 8. Store transaction temporarily<br/>INSERT INTO wallet_transactions
    API-->>NodeJS: Transaction ID generated

    NodeJS-->>API: 9. Return unsigned burn transaction
    API-->>UI: Transaction ready for signing

    Note over UI,CDN: Phase 3: Execution & Destruction
    UI->>UI: 10. Display burn confirmation<br/>- Warning about permanence<br/>- List what will be deleted<br/>- Final confirmation required

    UI->>Wallet: 11. Request transaction signature<br/>wallet.signTransaction(burnTx)
    Wallet->>Wallet: User confirms destruction<br/>- Understand irreversibility<br/>- Approve token burning<br/>- Sign transaction
    Wallet-->>UI: Signed burn transaction

    UI->>API: 12. POST /api/token/{token}/burn<br/>{transactionId, signature}

    API->>API: 13. Verify transaction integrity<br/>WalletService::matchTransactionSignature

    API->>NodeJS: 14. POST /send-signed-transaction<br/>Submit burn to blockchain
    NodeJS->>BC: 15. Broadcast burn transaction<br/>connection.sendRawTransaction

    BC->>BC: 16. Execute burn instruction:<br/>- Close token mint<br/>- Destroy metadata PDA<br/>- Reclaim SOL rent<br/>- Emit burn event

    BC-->>NodeJS: 17. Burn confirmed<br/>Token permanently destroyed
    NodeJS-->>API: Destruction confirmation

    Note over UI,CDN: Phase 4: Data Cleanup & Removal
    API->>API: 18. Delete Material entity<br/>- Remove from database<br/>- Delete associated records<br/>- Clear sale history

    API->>S3: 19. Delete material files<br/>- Remove original archive<br/>- Delete processed files<br/>- Clear thumbnails<br/>- Remove manifests

    API->>CDN: 20. Purge CDN cache<br/>- Clear cached content<br/>- Remove edge distributions<br/>- Invalidate URLs

    API->>API: 21. Record burn transaction<br/>INSERT INTO manage_transactions<br/>- TOKEN_BURN type<br/>- Destruction timestamp<br/>- Owner information

    API-->>UI: 22. Burn complete confirmation<br/>Token permanently destroyed

    UI->>UI: 23. Update interface<br/>- Remove from user collection<br/>- Show destruction success<br/>- Navigate away from token
```

#### Detailed Technical Flow - Token Claiming

```mermaid
sequenceDiagram
    participant UI as Frontend UI<br/>(React/TypeScript)
    participant Wallet as User Wallet<br/>(Phantom/Solflare)
    participant API as Symfony API<br/>(Claim Service)
    participant NodeJS as Node.js Server<br/>(Blockchain Service)
    participant BC as Solana Network<br/>(Blockchain)
    participant DB as MySQL Database<br/>(Platform Data)

    Note over UI,DB: Phase 1: Wallet Connection & Token Discovery
    UI->>UI: 1. User navigates to claim page<br/>- Access material claiming<br/>- Connect wallet for scanning

    UI->>Wallet: 2. Connect wallet<br/>for token scanning
    Wallet-->>UI: Wallet connected<br/>(User PublicKey)

    UI->>API: 3. GET /api/material-claim<br/>Scan for claimable tokens

    Note over UI,DB: Phase 2: Blockchain Token Scanning
    API->>NodeJS: 4. GET /wallet/{publicKey}/tokens<br/>Scan wallet for Sevens tokens
    NodeJS->>BC: 5. Query token accounts<br/>- Find all token accounts<br/>- Filter for Sevens tokens<br/>- Get metadata for each

    BC-->>NodeJS: 6. Token ownership list<br/>with metadata for each token
    NodeJS-->>API: Owned tokens with details

    API->>DB: 7. Check existing claims<br/>- Query materials table<br/>- Find unclaimed tokens<br/>- Identify new ownership

    DB-->>API: Claimable tokens identified
    API-->>UI: 8. Display claimable materials<br/>List of tokens to claim

    Note over UI,DB: Phase 3: Bulk Claiming Process
    UI->>UI: 9. User selects tokens<br/>- Review claimable materials<br/>- Select tokens to claim<br/>- Confirm claiming action

    UI->>Wallet: 10. Sign claiming verification<br/>wallet.signMessage(claimData)
    Wallet->>Wallet: User confirms claims
    Wallet-->>UI: Signed verification

    UI->>API: 11. POST /api/material-claim<br/>{tokenKeys, walletSignature}

    API->>API: 12. Verify wallet signature<br/>Confirm user controls wallet

    Note over UI,DB: Phase 4: Database Updates & Material Association
    loop For each claimable token
        API->>DB: 13. Update material ownership<br/>- Set user as owner<br/>- Link wallet to account<br/>- Activate material access

        API->>DB: 14. Create ownership history<br/>INSERT INTO material_ownership_history<br/>- Previous owner (if any)<br/>- New owner<br/>- Claim timestamp
    end

    API->>DB: 15. Bulk update completion<br/>Finalize all claims atomically

    API-->>UI: 16. Claiming success<br/>with claimed material count

    UI->>UI: 17. Navigate to collection<br/>- Show newly claimed materials<br/>- Display full access granted<br/>- Update user dashboard
```

**[→ View Implementation Details, Code Examples & Security Features](TECHNICAL_WORKFLOWS.md#4-token-burningclaiming-workflow)**

### **Complete System Architecture**

#### Token State Machine

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SEVENS TOKEN LIFECYCLE                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

          CREATION               PUBLISHING              MARKETPLACE             DESTRUCTION
    ┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │   TOKEN MINT    │      │    MATERIAL     │     │    OWNERSHIP    │     │   TOKEN BURN    │
    │                 │      │   PUBLICATION   │     │    TRANSFER     │     │                 │
    │ 1. Metadata     │  2.  │ 1. Archive      │ 3.  │ 1. Marketplace  │ 4.  │ 1. Destruction  │
    │    Definition───┼──────┤    Upload    ───┼─────┤    Listing   ───┼─────┤    Request      │
    │ • Name/Author   │      │ • File Process  │     │ • Price Setting │     │ • Owner Confirm │
    │ • File Hash     │      │ • CDN Deploy    │     │ • Buy/Sell      │     │ • Data Cleanup  │
    │ • Blockchain TX │      │ • Activation    │     │ • Ownership TX  │     │ • Irreversible  │
    └─────────────────┘      └─────────────────┘     └─────────────────┘     └─────────────────┘
             │                         │                      │                         │
             │                         │            ┌─────────┴──────┐                  │
             │                         │            │                │                  │
             │                         │            ▼                ▼                  │
             │                         │   ┌─────────────┐  ┌─────────────────┐         │
             │                         │   │   PRIVATE   │  │   MARKETPLACE   │         │
             │                         │   │  OWNERSHIP  │  │     TRADING     │         │
             │                         │   │             │  │                 │         │
             │                         │   │ • Personal  │  │ • Public Sale   │         │
             │                         │   │   Access    │  │ • Commission    │         │
             │                         │   │ • No Sale   │  │ • Price Disc    │         │
             │                         │   └─────────────┘  └─────────────────┘         │
             │                         │            │                │                  │
             │                         │            └────────────────┘                  │
             │                         │                     │                          │
             │                         └─────────────────────┼──────────────────────────┘
             │                                               │
             │          ┌────────────────────────────────────┘
             │          │
             ▼          ▼
    ┌─────────────────────────┐
    │     CLAIMING CYCLE      │
    │                         │
    │ • Wallet Scanning       │
    │ • Token Discovery       │
    │ • Platform Association  │
    │ • Account Linking       │
    │ • Bulk Operations       │
    └─────────────────────────┘
```

#### Integrated System Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              SEVENS PLATFORM COMPREHENSIVE ARCHITECTURE                           │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────────────────────────────────────┐
                        │                   FRONTEND LAYER                     │
                        │                                                      │
                        │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
                        │  │ Token UI    │  │ Material UI │  │ Marketplace  │  │
                        │  │ • Creation  │  │ • Upload    │  │ • Discovery  │  │
                        │  │ • Minting   │  │ • Publishing│  │ • Trading    │  │
                        │  │ • Burning   │  │ • Management│  │ • Purchasing │  │
                        │  └─────────────┘  └─────────────┘  └──────────────┘  │
                        │             │              │              │          │
                        └─────────────┼──────────────┼──────────────┼──────────┘
                                      │              │              │
                        ┌─────────────┼──────────────┼──────────────┼──────────┐
                        │             │          API LAYER          │          │
                        │             │                             │          │
                        │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
                        │  │  Token API  │  │   Material  │  │   Sale API   │  │
                        │  │ • /mint     │  │ API         │  │ • /buy       │  │
                        │  │ • /burn     │  │ • /create   │  │ • /sell      │  │
                        │  │ • /claim    │  │ • /upload   │  │ • /history   │  │
                        │  │ • /manage   │  │ • /publish  │  │ • /pricing   │  │
                        │  └─────────────┘  └─────────────┘  └──────────────┘  │
                        │             │              │              │          │
                        └─────────────┼──────────────┼──────────────┼──────────┘
                                      │              │              │
                        ┌─────────────┼──────────────┼──────────────┼──────────┐
                        │             │        SERVICE LAYER        │          │
                        │             │                             │          │
                        │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
                        │  │    Token    │  │   Material  │  │    Sale      │  │
                        │  │   Service   │  │   Service   │  │   Service    │  │
                        │  │ • Mint TX   │  │ • File Proc │  │ • Payment    │  │
                        │  │ • Burn TX   │  │ • CDN Deploy│  │ • Ownership  │  │
                        │  │ • Ownership │  │ • Validation│  │ • Commission │  │
                        │  └─────────────┘  └─────────────┘  └──────────────┘  │
                        │             │              │              │          │
                        └─────────────┼──────────────┼──────────────┼──────────┘
                                      │              │              │
     ┌─────────────┐    ┌─────────────┼──────────────┼──────────────┼──────────┐    ┌─────────────┐
     │   SOLANA    │    │             │     INFRASTRUCTURE LAYER    │          │    │    AWS      │
     │ BLOCKCHAIN  │    │             │                             │          │    │  SERVICES   │
     │             │◄───┤  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ├───►│             │
     │ • Token     │    │  │   Node.js   │  │    MySQL    │  │    Docker    │  │    │ • S3 Store  │
     │   Mints     │    │  │   Server    │  │   Database  │  │  Containers  │  │    │ • Lambda    │
     │ • Metadata  │    │  │ • Blockchain│  │ • Materials │  │ • Nginx      │  │    │ • CDN       │
     │ • Transfers │    │  │   Interface │  │ • Users     │  │ • SSL        │  │    │ • Processing│
     │ • Burns     │    │  │ • WebSocket │  │ • Wallets   │  │ • Scaling    │  │    │             │
     └─────────────┘    │  └─────────────┘  └─────────────┘  └──────────────┘  │    └─────────────┘
                        │             │              │              │          │
                        └─────────────┼──────────────┼──────────────┼──────────┘
                                      │              │              │
                        ┌─────────────┼──────────────┼──────────────┼───────────┐
                        │             │       SECURITY LAYER        │           │
                        │             │                             │           │
                        │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
                        │  │   Wallet    │  │    File     │  │  Transaction  │  │
                        │  │  Security   │  │  Security   │  │   Security    │  │
                        │  │ • Signature │  │ • Hash      │  │ • Verification│  │
                        │  │ • Ownership │  │ • Integrity │  │ • Anti-fraud  │  │
                        │  │ • Auth      │  │ • Validation│  │ • Audit       │  │
                        │  └─────────────┘  └─────────────┘  └───────────────┘  │
                        └───────────────────────────────────────────────────────┘
```

**[→ View Cross-Workflow Integration Points & Technical Implementation Examples](TECHNICAL_WORKFLOWS.md#complete-token-lifecycle-overview)**

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
┌──────────────────────────────────────────────────────────────────┐
│                          SEVENS ECOSYSTEM                        │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │   BACKOFFICE    │    │    PLATFORM     │    │    WALLET    │  │
│  │    (Admin)      │◄──►│   (User App)    │◄──►│  (Library)   │  │
│  │ • Fee Config    │    │ • Token Trading │    │ • UI Comps   │  │
│  │ • Monitoring    │    │ • Marketplace   │    │ • Security   │  │
│  │ • Analytics     │    │ • File Storage  │    │ • Multi-lang │  │
│  └─────────────────┘    └─────────────────┘    └──────────────┘  │
│           │                      │                    │          │
│           │                      │                    │          │
│           └──────────────────────┼────────────────────┘          │
│                                  │                               │
│                  ┌───────────────▼───────────────┐               │
│                  │        SMART CONTRACTS        │               │
│                  │         (Blockchain)          │               │
│                  │    • Token Operations         │               │
│                  │    • Marketplace Logic        │               │
│                  │    • Fee Collection           │               │
│                  │    • Hash Validation          │               │
│                  └───────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

This integrated ecosystem provides a complete solution for blockchain-based digital asset tokenization, from smart contract infrastructure to user interfaces and administrative tools.

## Acknowledgments

This project demonstrates advanced full-stack development capabilities including:
- Modern PHP/Symfony backend development
- React/TypeScript frontend development
- Blockchain integration and smart contract interactions
- Cloud infrastructure and microservices architecture
- DevOps practices with Docker and CI/CD
- Security best practices for web3 applications

The Sevens Platform showcases the integration of traditional web development with cutting-edge blockchain technology, providing a comprehensive solution for digital asset tokenization and marketplace functionality.

## Contact

**Anatolii Semochko**
- LinkedIn: [linkedin.com/in/anatolii-semochko](https://linkedin.com/in/anatolii-semochko)
- GitHub: [github.com/anatolii-semochko](https://github.com/anatolii-semochko)
- Email: anatoliy.semochko@gmail.com

## License

This project is proprietary software developed for educational and portfolio demonstration purposes.