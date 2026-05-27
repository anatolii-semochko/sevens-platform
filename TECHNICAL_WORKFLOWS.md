# Sevens Platform - Technical Token Workflows


## 1. Token Minting (Creation) Workflow


### Key Components

**Frontend (React/TypeScript)**
```typescript
// Token creation form with metadata and file handling
const TokenCreation = () => {
  const [metadata, setMetadata] = useState({
    name: '', author: '', description: '', fileHash: ''
  });

  // File upload with hash calculation
  const handleFileUpload = async (file: File) => {
    const hash = await calculateSHA256(file);
    const presignedUrl = await api.getPresignedUploadUrl({
      fileName: file.name, fileSize: file.size, fileHash: hash
    });
    await uploadToS3(file, presignedUrl);
  };

  // Token mint process
  const handleMint = async () => {
    const transaction = await api.getMintTransaction(mintPublicKey, metadata);
    const signedTx = await wallet.signTransaction(transaction);
    await api.submitMintTransaction(signedTx);
  };
};
```

**Backend API (Symfony/PHP)**
```php
// TokenController.php - Mint transaction endpoint
#[Route('/api/token/{mintPublicKey}/mint', methods: ['GET'])]
public function getMint(string $mintPublicKey): JsonResponse
{
    $transaction = $this->tokenService->getMintTransaction(
        mintPublicKey: $mintPublicKey,
        authorityPublicKey: $request->get('authorityPublicKey'),
        metadata: $request->get('metadata')
    );

    return $this->json([
        'transaction' => $transaction['transaction'],
        'transactionId' => $transaction['transactionId']
    ]);
}
```

**Node.js Blockchain Service**
```javascript
// Mint transaction generation
async createMintTransaction(mintPublicKey, authorityPublicKey, metadata) {
    const mintKeypair = new Keypair();
    const authority = new PublicKey(authorityPublicKey);

    const transaction = new Transaction();

    // Create mint account instruction
    const createMintIx = SystemProgram.createAccount({
        fromPubkey: authority,
        newAccountPubkey: mintKeypair.publicKey,
        space: MintLayout.span,
        lamports: await this.connection.getMinimumBalanceForRentExemption(MintLayout.span),
        programId: TOKEN_PROGRAM_ID,
    });

    // Initialize mint instruction
    const initMintIx = Token.createInitMintInstruction({
        mint: mintKeypair.publicKey,
        decimals: 0,
        mintAuthority: authority,
        freezeAuthority: authority,
    });

    transaction.add(createMintIx, initMintIx);

    return {
        transaction: transaction.serialize(),
        mintPublicKey: mintKeypair.publicKey.toString()
    };
}
```

## Security Features

### File Integrity Validation
- **SHA-256 Hashing**: Client-side file hash calculation
- **Blockchain Storage**: Immutable hash storage in token metadata
- **AWS Lambda Validation**: Server-side hash verification
- **Checksum Upload**: S3 presigned URLs with checksum requirements

### Transaction Security
- **Wallet Signature Verification**: Cryptographic proof of ownership
- **Transaction Matching**: Backend verification against stored transaction
- **Blockchain Confirmation**: On-chain transaction verification
- **Authority Validation**: Smart contract validates mint authority

### Access Control
- **Wallet Authentication**: Signature-based user authentication
- **Fee Validation**: Platform fee collection verification
- **Rate Limiting**: API request throttling protection
- **Input Sanitization**: Comprehensive metadata validation

This token minting workflow demonstrates the integration of traditional web development with cutting-edge blockchain technology, providing secure, verifiable digital asset creation with comprehensive file integrity validation.

## 2. Material Publishing/Listing Workflow


### Key Components

**Material Service (Symfony/PHP)**
```php
// MaterialService.php - Main material creation
public function createWithArchive(
    string $tokenKey,
    string $walletSignature,
    array $archiveData
): Material {
    // Validate token ownership
    $tokenData = $this->nodeServerApi->getToken($tokenKey);
    $this->walletService->verifyWalletSignature($walletSignature, $tokenData['owner']);

    // Create material entity
    $material = $this->create($tokenKey, $tokenData);

    // Process uploaded archive
    $this->materialFileService->processArchive($material, $archiveData);

    // Activate for marketplace
    $material->setIsActive(true);
    $this->entityManager->persist($material);
    $this->entityManager->flush();

    return $material;
}
```

**File Processing Service**
```php
// MaterialFileService.php - Archive processing
public function processArchive(Material $material, array $archiveData): void
{
    // Validate archive hash matches blockchain
    $expectedHash = $material->getToken()->getFileHash();
    $actualHash = hash_file('sha256', $archiveData['path']);

    if ($expectedHash !== $actualHash) {
        throw new ValidationException('Archive hash mismatch');
    }

    // Extract and process files
    $extractedPath = $this->extractArchive($archiveData['path']);
    $fileManifest = $this->processFiles($extractedPath);

    // Generate thumbnails and previews
    $this->generateThumbnails($fileManifest);

    // Upload to S3 with CDN distribution
    $this->uploadToS3($fileManifest);

    // Clean up temporary files
    $this->cleanupTempFiles($extractedPath);
}
```

**AWS Lambda Processing Function**
```javascript
// Lambda function for file processing
exports.handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

    // Download archive from S3
    const archiveBuffer = await s3.getObject({ Bucket: bucket, Key: key }).promise();

    // Extract archive contents
    const zip = new AdmZip(archiveBuffer.Body);
    const zipEntries = zip.getEntries();

    const processedFiles = [];

    for (const entry of zipEntries) {
        if (!entry.isDirectory) {
            // Process each file
            const processed = await processFile(entry);
            processedFiles.push(processed);

            // Generate thumbnail if image
            if (isImage(entry.name)) {
                const thumbnail = await generateThumbnail(entry.getData());
                await uploadToS3(thumbnail, `thumbnails/${entry.name}`);
            }
        }
    }

    // Create manifest file
    const manifest = {
        files: processedFiles,
        processedAt: new Date().toISOString(),
        totalSize: archiveBuffer.Body.length
    };

    await uploadToS3(JSON.stringify(manifest), `manifests/${key}.json`);

    // Notify API via webhook
    await axios.post(API_WEBHOOK_URL, {
        status: 'completed',
        archiveKey: key,
        fileCount: processedFiles.length
    });
};
```

**Frontend Material Creation**
```typescript
// MaterialCreation.tsx - Material publishing UI
const MaterialCreation = () => {
  const [token, setToken] = useState(null);
  const [archiveFile, setArchiveFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTokenValidation = async (tokenKey: string) => {
    // Verify user owns token
    const signature = await wallet.signMessage(tokenKey);
    const tokenData = await api.validateTokenOwnership(tokenKey, signature);
    setToken(tokenData);
  };

  const handleArchiveUpload = async () => {
    setIsProcessing(true);

    // Get upload URL
    const uploadUrl = await api.getPresignedUploadUrl({
      fileName: archiveFile.name,
      fileSize: archiveFile.size,
      tokenKey: token.publicKey
    });

    // Upload to S3
    await uploadFileToS3(archiveFile, uploadUrl);

    // Create material
    const material = await api.createMaterial({
      tokenKey: token.publicKey,
      walletSignature: await wallet.signMessage(token.publicKey)
    });

    setIsProcessing(false);
    navigate(`/material/${material.id}`);
  };
};
```

### File Processing Pipeline

**Archive Validation**
1. **Hash Verification**: Uploaded archive hash must match blockchain token hash
2. **Format Validation**: Only ZIP archives accepted for material containers
3. **Size Limits**: Maximum archive size enforced (configurable limit)
4. **Content Scanning**: Lambda-based malware and content validation

**File Extraction & Processing**
1. **Archive Extraction**: ZIP files extracted to temporary processing space
2. **File Cataloging**: Complete manifest of all contained files created
3. **Image Processing**: Thumbnails and previews generated for visual content
4. **Optimization**: Files optimized for web delivery (compression, format conversion)

**CDN Distribution**
1. **S3 Storage**: Processed files stored in S3 with organized structure
2. **CloudFlare Integration**: Global CDN distribution for fast content delivery
3. **Cache Optimization**: Automatic caching strategies based on content type
4. **Format Serving**: Adaptive format delivery (WebP, AVIF) based on browser support

### Security & Validation

**Ownership Verification**
- **Blockchain Validation**: Token ownership verified against Solana blockchain
- **Wallet Signature**: Cryptographic proof of wallet ownership required
- **Transfer Detection**: Ownership changes automatically update material access
- **Authority Validation**: Only token owner can publish material

**File Integrity**
- **Hash Matching**: Archive content must match blockchain-stored hash
- **Immutable Verification**: Blockchain hash provides tamper-proof validation
- **Processing Verification**: Lambda validates files during processing
- **Content Verification**: Additional validation for file types and content

**Access Control**
- **Publication Control**: Owner decides when to make material public
- **Marketplace Integration**: Seamless integration with buying/selling workflows
- **Privacy Options**: Materials can be private, public, or marketplace-listed
- **Transfer Handling**: Material access automatically follows token ownership

This material publishing workflow demonstrates the sophisticated integration of blockchain verification, cloud file processing, and global content delivery, creating a secure and scalable platform for digital material distribution.

## 3. Token Purchasing (Buy) Workflow



### Key Components

**Sale Service (Symfony/PHP)**
```php
// MaterialSaleService.php - Purchase processing
public function executePurchase(
    string $tokenKey,
    string $buyerPublicKey,
    string $transactionId,
    string $signature
): array {
    // Validate transaction
    $this->walletService->matchTransactionSignature($transactionId, $signature);

    // Get material and verify sale status
    $material = $this->materialRepository->findByTokenKey($tokenKey);
    if (!$material->isForSale()) {
        throw new InvalidStateException('Material not for sale');
    }

    // Send transaction to blockchain
    $result = $this->nodeServerApi->sendSignedTransaction($signature);

    // Update ownership in database
    $this->transferOwnership($material, $buyerPublicKey, $material->getPrice());

    // Record sale history
    $this->recordSaleHistory($material, $result);

    return [
        'success' => true,
        'newOwner' => $buyerPublicKey,
        'transactionHash' => $result['transactionHash']
    ];
}
```

**Purchase Transaction Generation**
```javascript
// Node.js - Buy transaction creation
async generateBuyTransaction(tokenKey, buyerPublicKey, sellerPublicKey, price) {
    const buyer = new PublicKey(buyerPublicKey);
    const seller = new PublicKey(sellerPublicKey);
    const token = new PublicKey(tokenKey);

    // Calculate fees
    const platformFee = price * PLATFORM_FEE_PERCENTAGE;
    const sellerAmount = price - platformFee;

    const transaction = new Transaction();

    // Transfer SOL to seller
    const paymentIx = SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: seller,
        lamports: sellerAmount * LAMPORTS_PER_SOL,
    });

    // Transfer platform fee
    const feeIx = SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: PLATFORM_FEE_WALLET,
        lamports: platformFee * LAMPORTS_PER_SOL,
    });

    // Transfer token ownership (if token account exists)
    const tokenTransferIx = await this.createTokenTransferInstruction(
        token, seller, buyer
    );

    transaction.add(paymentIx, feeIx, tokenTransferIx);

    return {
        transaction: transaction.serialize(),
        totalAmount: price,
        platformFee: platformFee,
        sellerAmount: sellerAmount
    };
}
```

**Frontend Purchase Interface**
```typescript
// MaterialPurchase.tsx - Buy material UI
const MaterialPurchase = ({ material }: { material: Material }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState(null);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      // Get buy transaction
      const transaction = await api.getBuyTransaction(
        material.tokenKey,
        wallet.publicKey.toString()
      );

      // Show purchase confirmation
      setPurchaseDetails({
        price: material.price,
        platformFee: transaction.platformFee,
        total: transaction.totalAmount,
        seller: material.owner
      });

      // Get user confirmation
      const confirmed = await showPurchaseConfirmation(purchaseDetails);
      if (!confirmed) return;

      // Sign transaction
      const signedTx = await wallet.signTransaction(
        Transaction.from(Buffer.from(transaction.transaction, 'base64'))
      );

      // Execute purchase
      const result = await api.executePurchase({
        tokenKey: material.tokenKey,
        transactionId: transaction.transactionId,
        signature: Buffer.from(signedTx.serialize()).toString('base64')
      });

      // Navigate to owned material
      navigate(`/material/${material.tokenKey}?purchased=true`);

    } catch (error) {
      showErrorMessage('Purchase failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="purchase-interface">
      <MaterialPreview material={material} />

      <PurchaseDetails
        price={material.price}
        seller={material.owner}
        onPurchase={handlePurchase}
        isLoading={isLoading}
      />

      {purchaseDetails && (
        <ConfirmationModal
          details={purchaseDetails}
          onConfirm={handlePurchase}
          onCancel={() => setPurchaseDetails(null)}
        />
      )}
    </div>
  );
};
```

### Payment Processing

**SOL Transfer Mechanism**
1. **Price Calculation**: Material price set by owner in SOL
2. **Platform Commission**: Automatic fee deduction (configurable percentage)
3. **Seller Payout**: Net amount transferred to seller's wallet
4. **Fee Collection**: Platform fees sent to designated wallet

**Transaction Verification**
1. **Ownership Validation**: Verify current owner before purchase
2. **Price Verification**: Confirm price hasn't changed during transaction
3. **Balance Check**: Ensure buyer has sufficient SOL balance
4. **Duplicate Prevention**: Prevent double-purchase attempts

### Database Updates

**Material Entity Changes**
```sql
-- Update material ownership and reset price
UPDATE materials
SET
    user_id = (SELECT id FROM users WHERE wallet_public_key = ?),
    price = 0,
    for_sale = false,
    updated_at = NOW()
WHERE token_key = ?;
```

**Sale History Recording**
```sql
-- Record complete sale transaction
INSERT INTO material_sale_history (
    material_id,
    previous_owner_id,
    new_owner_id,
    sale_price,
    platform_fee,
    seller_amount,
    transaction_hash,
    sold_at
) VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
```

**Platform Transaction Logging**
```sql
-- Track platform revenue from sale
INSERT INTO manage_transactions (
    type,
    user_id,
    target_wallet,
    amount,
    fee_amount,
    transaction_hash,
    created_at
) VALUES ('TOKEN_BUY', ?, ?, ?, ?, ?, NOW());
```

### Security Features

**Purchase Validation**
- **Ownership Verification**: Cannot purchase own materials
- **Sale Status Check**: Material must be actively for sale
- **Price Consistency**: Price locked during transaction process
- **Wallet Balance**: Sufficient funds verification before transaction

**Transaction Security**
- **Signature Verification**: Cryptographic proof of purchase intent
- **Blockchain Confirmation**: On-chain transaction verification
- **Atomic Operations**: Database updates only after blockchain confirmation
- **Rollback Handling**: Failed transactions don't update ownership

**Fraud Prevention**
- **Double-Spend Protection**: Transaction ID prevents duplicate submissions
- **Price Manipulation**: Prices locked during purchase process
- **Identity Verification**: Wallet signature confirms buyer identity
- **Platform Fee Enforcement**: Automatic commission calculation and collection

This token purchasing workflow demonstrates secure, transparent digital asset transactions with automatic payment processing, ownership verification, and comprehensive audit trails, creating a trustworthy marketplace environment for digital material trading.

## 4. Token Burning/Claiming Workflow



### Key Components

**Token Burning Service (Symfony/PHP)**
```php
// TokenService.php - Burn functionality
public function burn(
    string $tokenKey,
    string $ownerPublicKey,
    string $transactionId,
    string $signature
): array {
    // Validate transaction signature
    $this->walletService->matchTransactionSignature($transactionId, $signature);

    // Verify ownership
    $material = $this->materialRepository->findByTokenKey($tokenKey);
    if ($material->getUser()->getWalletPublicKey() !== $ownerPublicKey) {
        throw new UnauthorizedException('Not token owner');
    }

    // Execute blockchain burn
    $result = $this->nodeServerApi->sendSignedTransaction($signature);

    // Clean up all associated data
    $this->cleanupMaterialData($material);

    // Record destruction
    $this->recordBurnTransaction($tokenKey, $ownerPublicKey, $result);

    return ['success' => true, 'destroyed' => true];
}

private function cleanupMaterialData(Material $material): void
{
    // Delete files from S3
    $this->materialFileService->deleteAllFiles($material);

    // Purge CDN cache
    $this->cdnService->purgeContent($material->getCdnUrls());

    // Remove database records
    $this->entityManager->remove($material);
    $this->entityManager->flush();
}
```

**Material Claiming Service**
```php
// MaterialClaimService.php - Token claiming
public function claimMaterials(
    string $walletPublicKey,
    string $walletSignature,
    array $tokenKeys
): array {
    // Verify wallet signature
    $this->walletService->verifyWalletSignature($walletSignature, $walletPublicKey);

    // Get or create user account
    $user = $this->userService->getOrCreateUserByWallet($walletPublicKey);

    $claimedCount = 0;
    $errors = [];

    foreach ($tokenKeys as $tokenKey) {
        try {
            // Verify token ownership on blockchain
            $tokenData = $this->nodeServerApi->getToken($tokenKey);
            if ($tokenData['owner'] !== $walletPublicKey) {
                throw new InvalidOwnershipException("User doesn't own token {$tokenKey}");
            }

            // Find or create material
            $material = $this->materialRepository->findByTokenKey($tokenKey);
            if (!$material) {
                $material = $this->materialService->createFromToken($tokenKey, $tokenData);
            }

            // Update ownership
            $material->setUser($user);
            $material->setIsActive(true);

            $this->entityManager->persist($material);
            $claimedCount++;

        } catch (Exception $e) {
            $errors[] = "Failed to claim {$tokenKey}: " . $e->getMessage();
        }
    }

    $this->entityManager->flush();

    return [
        'claimedCount' => $claimedCount,
        'errors' => $errors,
        'totalRequested' => count($tokenKeys)
    ];
}
```

**Blockchain Token Scanner (Node.js)**
```javascript
// tokenScanner.js - Wallet token discovery
async scanWalletTokens(walletPublicKey) {
    const wallet = new PublicKey(walletPublicKey);

    // Get all token accounts for wallet
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
    });

    const sevensTokens = [];

    for (const account of tokenAccounts.value) {
        const tokenData = await this.connection.getAccountInfo(account.pubkey);
        const mint = new PublicKey(tokenData.data.slice(0, 32));

        try {
            // Check if this is a Sevens token by looking for metadata
            const metadataPDA = await this.getMetadataPDA(mint);
            const metadata = await this.connection.getAccountInfo(metadataPDA);

            if (metadata && this.isSevensToken(metadata.data)) {
                const tokenInfo = await this.parseTokenMetadata(metadata.data);
                sevensTokens.push({
                    mintPublicKey: mint.toString(),
                    owner: walletPublicKey,
                    metadata: tokenInfo,
                    lastUpdated: new Date().toISOString()
                });
            }
        } catch (error) {
            // Skip tokens that don't have Sevens metadata
            continue;
        }
    }

    return sevensTokens;
}
```

**Frontend Claiming Interface**
```typescript
// MaterialClaimPage.tsx - Claim materials UI
const MaterialClaimPage = () => {
  const [claimableTokens, setClaimableTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isclaiming, setIsClaiming] = useState(false);

  const scanForTokens = async () => {
    setIsScanning(true);

    try {
      const tokens = await api.getClaimableTokens(wallet.publicKey.toString());
      setClaimableTokens(tokens);
    } catch (error) {
      showErrorMessage('Failed to scan for tokens: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClaim = async () => {
    if (selectedTokens.length === 0) return;

    setIsClaiming(true);

    try {
      // Sign claiming verification
      const message = `Claiming ${selectedTokens.length} materials`;
      const signature = await wallet.signMessage(new TextEncoder().encode(message));

      // Submit claims
      const result = await api.claimMaterials({
        tokenKeys: selectedTokens,
        walletSignature: Array.from(signature)
      });

      showSuccessMessage(`Successfully claimed ${result.claimedCount} materials`);

      // Navigate to user's collection
      navigate('/my-materials');

    } catch (error) {
      showErrorMessage('Claiming failed: ' + error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="claim-page">
      <h1>Claim Your Materials</h1>

      <button onClick={scanForTokens} disabled={isScanning}>
        {isScanning ? 'Scanning...' : 'Scan Wallet for Tokens'}
      </button>

      {claimableTokens.length > 0 && (
        <div className="claimable-tokens">
          <h2>Claimable Materials ({claimableTokens.length})</h2>

          {claimableTokens.map(token => (
            <ClaimableTokenCard
              key={token.mintPublicKey}
              token={token}
              isSelected={selectedTokens.includes(token.mintPublicKey)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedTokens([...selectedTokens, token.mintPublicKey]);
                } else {
                  setSelectedTokens(selectedTokens.filter(k => k !== token.mintPublicKey));
                }
              }}
            />
          ))}

          <button
            onClick={handleClaim}
            disabled={selectedTokens.length === 0 || isClaiming}
            className="claim-button"
          >
            {isClaiming ? 'Claiming...' : `Claim ${selectedTokens.length} Materials`}
          </button>
        </div>
      )}
    </div>
  );
};
```

### Security Considerations

**Burn Protection**
- **Multiple Confirmations**: Users must confirm destruction multiple times
- **Ownership Verification**: Only token owner can initiate burn
- **Irreversibility Warning**: Clear communication about permanent destruction
- **Data Cleanup**: Complete removal of all associated data

**Claim Validation**
- **Blockchain Verification**: Token ownership verified on-chain before claiming
- **Signature Verification**: Wallet signature required for claim verification
- **Duplicate Prevention**: Prevents claiming already-claimed materials
- **Batch Processing**: Atomic transactions for multiple claims

**Data Integrity**
- **Complete Cleanup**: Burn operations remove all traces of material data
- **Access Control**: Claimed materials immediately accessible to new owner
- **History Tracking**: Ownership changes logged for audit purposes
- **Error Handling**: Failed operations don't leave partial state changes

### Business Logic

**Burn Scenarios**
1. **User Decision**: Owner voluntarily destroys unwanted token
2. **Content Issues**: Removal of problematic or copyrighted material
3. **Space Management**: Cleanup of storage resources
4. **Privacy Protection**: Permanent removal of sensitive content

**Claim Scenarios**
1. **New User Registration**: Connecting existing tokens to new platform account
2. **Wallet Migration**: Moving tokens between different wallet addresses
3. **Batch Operations**: Efficiently claiming multiple materials at once
4. **Account Recovery**: Re-establishing access to owned materials

This burning and claiming workflow provides comprehensive token lifecycle management, ensuring users maintain full control over their digital assets while providing secure mechanisms for both destruction and account association within the platform ecosystem.

## Complete Token Lifecycle Overview


### Cross-Workflow Integration Points

**1. Token-to-Material Linking**
```typescript
interface TokenMaterialBinding {
  tokenKey: string;           // Blockchain token identifier
  materialId: number;         // Database material entity
  fileHash: string;          // Immutable content hash
  ownerWallet: string;       // Current owner public key
  createdAt: Date;          // Creation timestamp
  lastTransfer?: Date;      // Last ownership change
}
```

**2. Ownership Transfer Chain**
```
Token Mint → Material Creation → Marketplace Listing → Purchase → Ownership Transfer → Burn/Claim
     ↓               ↓                    ↓                ↓              ↓                ↓
 Blockchain       Database           Platform UI      Payment TX      Database         Blockchain
    PDA           Material            Price Set       SOL Transfer   Owner Update      Destruction
```

**3. File Integrity Verification**
```javascript
// Hash verification across all workflows
const verifyFileIntegrity = async (tokenKey: string, uploadedFile: File) => {
  // 1. Get hash from blockchain token metadata
  const blockchainHash = await getTokenMetadata(tokenKey).fileHash;

  // 2. Calculate hash of uploaded file
  const uploadedHash = await calculateSHA256(uploadedFile);

  // 3. Verify integrity
  if (blockchainHash !== uploadedHash) {
    throw new IntegrityError('File does not match blockchain hash');
  }

  return true;
};
```

### Performance Optimization Strategies

**1. Batch Operations**
- **Token Claiming**: Multiple tokens processed in single database transaction
- **File Processing**: Parallel Lambda execution for multiple archives
- **CDN Invalidation**: Bulk cache clearing operations
- **Blockchain Queries**: Batched RPC calls for efficiency

**2. Caching Layers**
- **Metadata Caching**: Token metadata cached in Redis (TTL: 1 hour)
- **File CDN**: Global edge caching with automatic invalidation
- **Database Queries**: Query result caching for frequently accessed data
- **Blockchain State**: Local state caching with periodic synchronization

**3. Async Processing**
- **File Upload**: Direct S3 upload with webhook notifications
- **Image Processing**: Background thumbnail generation via Lambda
- **Blockchain Confirmation**: Non-blocking transaction monitoring
- **Email Notifications**: Queue-based notification system

### Error Handling & Recovery

**1. Transaction Failures**
```
User Action → Transaction Generation → Signing → Blockchain → Database Update
     ↓                  ↓                 ↓           ↓              ↓
   Retry         Store for Later     User Cancel  Auto-Retry      Rollback
```

**2. File Processing Failures**
- **Upload Retry**: Automatic retry with exponential backoff
- **Processing Queue**: Failed files queued for manual review
- **Partial Recovery**: Successfully processed files retained
- **User Notification**: Clear error messages with next steps

**3. Blockchain Network Issues**
- **RPC Failover**: Multiple Solana RPC endpoints for redundancy
- **Transaction Replay**: Automatic transaction resubmission
- **State Reconciliation**: Periodic blockchain-database synchronization
- **Graceful Degradation**: Read-only mode during network issues

This comprehensive technical documentation demonstrates the sophisticated integration of blockchain technology with modern web development, creating a secure, scalable platform for digital asset tokenization and marketplace functionality. The detailed workflows show how each operation maintains data integrity, security, and user experience while providing complete audit trails and ownership verification.