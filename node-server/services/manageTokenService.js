const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { loadIdl, initializeProvider } = require('../utils/blockchain')
const sevensTokenService = require('./sevensTokenService')
const tariffsService = require('./TariffsService')

class ManageTokenService {
    constructor() {
        const { connection, provider } = initializeProvider()
        this.connection = connection
        this.provider = provider

        this.managementIdl = null
        this.managementProgram = null

        this.loadIdl().catch(e => console.error(`Sevens Token Management IDL loading error. Path: ${process.env.SEVENS_TOKEN_MANAGEMENT_IDL_PATH}.`, e))
    }

    async loadIdl() {
        try {
            const idlPath = process.env.SEVENS_TOKEN_MANAGEMENT_IDL_PATH
            if (!idlPath) {
                throw new Error('SEVENS_TOKEN_MANAGEMENT_IDL_PATH not set in environment')
            }

            this.managementIdl = await loadIdl(idlPath)
            const programId = new PublicKey(this.managementIdl.metadata.address)
            this.managementProgram = new anchor.Program(this.managementIdl, programId, this.provider)

            console.log('✅ Sevens Token Management IDL loaded successfully')
            console.log(`   Program ID: ${programId.toString()}`)
        } catch (error) {
            console.error('Failed to load Sevens Token Management IDL:', error)
            throw error
        }
    }

    /**
     * Get TokenManagementData PDA address for a token mint
     */
    getTokenManagementDataPda(mintPublicKey) {
        const mint = new PublicKey(mintPublicKey)
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('token_data'), mint.toBuffer()],
            this.managementProgram.programId
        )
        return pda
    }

    /**
     * Get tariffs PDA address
     */
    getTariffsPda() {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('tariffs')],
            this.managementProgram.programId
        )
        return pda
    }

    /**
     * Get TokenManagementData for a token
     */
    async getTokenManagementData(tokenPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        try {
            const accountInfo = await this.connection.getAccountInfo(tokenDataPda)

            // If account doesn't exist, return null
            if (!accountInfo) {
                return null
            }

            const tokenData = await this.managementProgram.account.tokenManagementData.fetch(tokenDataPda)

            return {
                mint: tokenData.mint.toString(),
                owner: tokenData.owner.toString(),
                onSale: tokenData.onSale,
                price: tokenData.price.toString(),
                retailPrice: tokenData.retailPrice.toString(),
                mintedThroughManagement: tokenData.mintedThroughManagement,
                lastOperation: Object.keys(tokenData.lastOperation)[0],
                lastOperationTimestamp: tokenData.lastOperationTimestamp.toString(),
            }
        } catch (error) {
            // If account doesn't exist, return null
            if (error.message.includes('Account does not exist')) {
                return null
            }
            throw error
        }
    }

    /**
     * Match token actual state with TokenManagementData
     * Returns true if match, or array of mismatches
     */
    async matchTokenData(tokenPublicKey) {
        try {
            // Get actual token data from blockchain
            const tokenData = await sevensTokenService.getTokenByPublicKey(tokenPublicKey)

            // Get management data
            const managementData = await this.getTokenManagementData(tokenPublicKey)

            // If no management data exists, token is absent from management
            if (!managementData) {
                return {
                    match: false,
                    mismatches: ['tokenAbsent'],
                }
            }

            const mismatches = []

            // Check owner
            if (tokenData.walletPublicKey !== managementData.owner) {
                mismatches.push('walletPublicKey')
            }

            // Check onSale status
            if (tokenData.sale.onSale !== managementData.onSale) {
                mismatches.push('onSale')
            }

            // Check price
            if (tokenData.sale.priceLamports.toString() !== managementData.price) {
                mismatches.push('price')
            }

            if (mismatches.length === 0) {
                return { match: true }
            }

            return {
                match: false,
                mismatches,
            }
        } catch (error) {
            console.error('Error matching token data:', error)
            throw error
        }
    }

    /**
     * Get retail price (price with buy fee already included)
     * Returns null if not on sale
     */
    async getPriceWithFee(tokenPublicKey) {
        try {
            const managementData = await this.getTokenManagementData(tokenPublicKey)

            if (!managementData || !managementData.onSale) {
                return null
            }

            return managementData.retailPrice
        } catch (error) {
            console.error('Error getting price with fee:', error)
            throw error
        }
    }

    /**
     * Get mint transaction
     * Note: This registers an existing token in the management layer
     * The token must already be minted through sevens-token
     */
    async getMintTransaction(payerPublicKey, tokenPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        // Validate inputs
        if (!PublicKey.isOnCurve(payerPublicKey)) {
            throw new Error('Invalid payer public key')
        }
        if (!PublicKey.isOnCurve(tokenPublicKey)) {
            throw new Error('Invalid token public key')
        }

        const payer = new PublicKey(payerPublicKey)
        const mint = new PublicKey(tokenPublicKey)
        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenAccount = getAssociatedTokenAddressSync(mint, payer, false, TOKEN_PROGRAM_ID)
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        // Get token data to pass metadata
        const tokenData = await sevensTokenService.getTokenByPublicKey(tokenPublicKey)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedMint(
                tokenData.metadata.author,
                tokenData.metadata.hash,
                tokenData.metadata.description,
                tokenData.metadata.name,
                tokenData.metadata.canBeBurned
            )
            .accounts({
                payer,
                tariffs: tariffsPda,
                targetWallet,
                mint,
                tokenAccount,
                tokenManagementData: tokenDataPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = payer

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash

        // Serialize transaction
        const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')

        return {
            transaction: serializedTx,
            blockhash,
            lastValidBlockHeight,
        }
    }

    /**
     * Get setSale transaction
     */
    async getSetSaleTransaction(tokenPublicKey, ownerPublicKey, onSale, price) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        // Validate inputs
        if (!PublicKey.isOnCurve(tokenPublicKey)) {
            throw new Error('Invalid token public key')
        }
        if (!PublicKey.isOnCurve(ownerPublicKey)) {
            throw new Error('Invalid owner public key')
        }

        const mint = new PublicKey(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)
        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        // Get sevens-token program and PDAs
        const sevensTokenProgramId = new PublicKey('Ah4sw8i5k74TC7tCzSrqkEitNdQVRhgrPsKfUrhqzEbn')
        const [salePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('sale'), mint.toBuffer()],
            sevensTokenProgramId
        )
        const [saleAuthorityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('sale'), mint.toBuffer()],
            sevensTokenProgramId
        )

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedSetSale(onSale, new anchor.BN(price || 0))
            .accounts({
                owner,
                tariffs: tariffsPda,
                targetWallet,
                mint,
                tokenAccount,
                tokenManagementData: tokenDataPda,
                sale: salePda,
                saleAuthority: saleAuthorityPda,
                sevensTokenProgram: sevensTokenProgramId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = owner

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash

        // Serialize transaction
        return tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')
    }

    /**
     * Get buy transaction
     */
    async getBuyTransaction(tokenPublicKey, buyerPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        // Validate inputs
        if (!PublicKey.isOnCurve(tokenPublicKey)) {
            throw new Error('Invalid token public key')
        }
        if (!PublicKey.isOnCurve(buyerPublicKey)) {
            throw new Error('Invalid buyer public key')
        }

        const mint = new PublicKey(tokenPublicKey)
        const buyer = new PublicKey(buyerPublicKey)
        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        // Get management data to get seller and expected price
        const managementData = await this.getTokenManagementData(tokenPublicKey)
        if (!managementData) {
            throw new Error('Token not managed or data not found')
        }
        if (!managementData.onSale) {
            throw new Error('Token is not for sale')
        }

        const seller = new PublicKey(managementData.owner)
        const expectedPrice = new anchor.BN(managementData.price)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedBuy(expectedPrice)
            .accounts({
                buyer,
                tariffs: tariffsPda,
                targetWallet,
                seller,
                mint,
                tokenManagementData: tokenDataPda,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = buyer

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash

        // Serialize transaction
        return tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')
    }

    /**
     * Get burn transaction
     */
    async getBurnTransaction(tokenPublicKey, ownerPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        // Validate inputs
        if (!PublicKey.isOnCurve(tokenPublicKey)) {
            throw new Error('Invalid token public key')
        }
        if (!PublicKey.isOnCurve(ownerPublicKey)) {
            throw new Error('Invalid owner public key')
        }

        const mint = new PublicKey(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)
        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedBurn()
            .accounts({
                owner,
                tariffs: tariffsPda,
                targetWallet,
                mint,
                tokenAccount,
                tokenManagementData: tokenDataPda,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = owner

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash

        // Serialize transaction
        const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')

        return {
            transaction: serializedTx,
            blockhash,
            lastValidBlockHeight,
        }
    }

    /**
     * Execute signed mint transaction
     */
    async executeMint(signedTransaction) {
        const tx = Transaction.from(Buffer.from(signedTransaction, 'base64'))
        const signature = await this.connection.sendRawTransaction(tx.serialize())
        await this.connection.confirmTransaction(signature)

        return {
            signature,
            status: 'confirmed',
        }
    }

    /**
     * Execute signed setSale transaction
     */
    async executeSetSale(signedTransaction) {
        const tx = Transaction.from(Buffer.from(signedTransaction, 'base64'))
        const signature = await this.connection.sendRawTransaction(tx.serialize())
        await this.connection.confirmTransaction(signature)

        return {
            signature,
            status: 'confirmed',
        }
    }

    /**
     * Execute signed buy transaction
     */
    async executeBuy(signedTransaction) {
        const tx = Transaction.from(Buffer.from(signedTransaction, 'base64'))
        const signature = await this.connection.sendRawTransaction(tx.serialize())
        await this.connection.confirmTransaction(signature)

        return {
            signature,
            status: 'confirmed',
        }
    }

    /**
     * Execute signed burn transaction
     */
    async executeBurn(signedTransaction) {
        const tx = Transaction.from(Buffer.from(signedTransaction, 'base64'))
        const signature = await this.connection.sendRawTransaction(tx.serialize())
        await this.connection.confirmTransaction(signature)

        return {
            signature,
            status: 'confirmed',
        }
    }
}

module.exports = new ManageTokenService()
