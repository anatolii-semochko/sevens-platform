const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { loadIdl, initializeProvider, getPda, checkIsWalletAddress } = require('../utils/blockchain')
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

    getTokenManagementDataPda(mintPublicKey) {
        const mint = new PublicKey(mintPublicKey)
        return getPda(this.managementProgram.programId, 'token_data', mint)
    }

    getTariffsPda() {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from('tariffs')],
            this.managementProgram.programId
        )
        return pda
    }

    getSalePda(mintPublicKey) {
        const mint = new PublicKey(mintPublicKey)
        return getPda(sevensTokenService.program.programId, 'sale', mint)
    }

    async getTokenManagementData(tokenPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        try {
            const accountInfo = await this.connection.getAccountInfo(tokenDataPda)
            if (!accountInfo) {
                return null
            }

            const tokenData = await this.managementProgram.account.tokenManagementData.fetch(tokenDataPda)

            return {
                mint: tokenData.mint.toString(),
                owner: tokenData.owner.toString(),
                onSale: tokenData.onSale,
                price: tokenData.price.toString(),
                saleFee: tokenData.saleFee,
                mintedThroughManagement: tokenData.mintedThroughManagement,
                lastOperation: Object.keys(tokenData.lastOperation)[0],
                lastOperationTimestamp: tokenData.lastOperationTimestamp.toString(),
            }
        } catch (error) {
            if (error.message.includes('Account does not exist')) {
                return null
            }
            throw error
        }
    }

    async matchTokenData(tokenPublicKey) {
        try {
            const tokenData = await sevensTokenService.getTokenByPublicKey(tokenPublicKey)
            const managementData = await this.getTokenManagementData(tokenPublicKey)

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

    async getPriceWithFee(tokenPublicKey) {
        try {
            const managementData = await this.getTokenManagementData(tokenPublicKey)

            if (!managementData || !managementData.onSale) {
                return null
            }

            // Calculate retail price (base price + fee percentage)
            const basePrice = BigInt(managementData.price)
            const feePercentage = BigInt(managementData.saleFee)
            const retailPrice = basePrice + (basePrice * (feePercentage ? feePercentage / 100 : 1))

            return retailPrice.toString()
        } catch (error) {
            console.error('Error getting price with fee:', error)
            throw error
        }
    }

    async getMintTransaction(walletPublicKey, mintPublicKey, mintParams) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        const { author, hash, description, tokenName, canBeBurned } = mintParams

        // Validate required parameters
        if (!hash || !tokenName) {
            throw new Error('Missing required mint parameters: hash, tokenName')
        }

        const payer = new PublicKey(walletPublicKey)
        const mint = new PublicKey(mintPublicKey)

        checkIsWalletAddress(payer)
        checkIsWalletAddress(mint)

        // Get PDAs
        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenAccount = getAssociatedTokenAddressSync(mint, payer, false, TOKEN_PROGRAM_ID)
        const tokenDataPda = this.getTokenManagementDataPda(mint.toString())

        // Get PDAs from sevens-token program
        const metadataPda = getPda(sevensTokenService.program.programId, 'metadata', mint)
        const salePda = getPda(sevensTokenService.program.programId, 'sale', mint)
        const hashRegistryPda = sevensTokenService.getHashPda(sevensTokenService.program.programId, hash)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedMint(
                author,
                hash,
                description,
                tokenName,
                canBeBurned || false
            )
            .accounts({
                payer,
                tariffs: tariffsPda,
                targetWallet,
                mint,
                metadata: metadataPda,
                sale: salePda,
                tokenAccount,
                hashRegistry: hashRegistryPda,
                tokenManagementData: tokenDataPda,
                sevensTokenProgram: sevensTokenService.program.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([])
            .instruction()

        // Create transaction (without signing - will be signed on frontend)
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = payer
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        // Return unsigned transaction
        // Frontend will sign it with both payer and mint keypairs
        return {
            transaction: tx.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            }).toString('base64'),
            mint: mint.toString(),
        }
    }

    async getSetSaleTransaction(tokenPublicKey, ownerPublicKey, onSale, price) {
        const mint = new PublicKey(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)

        checkIsWalletAddress(mint)
        checkIsWalletAddress(owner)

        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)
        const salePda = this.getSalePda(tokenPublicKey)

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
                saleAuthority: salePda,
                sevensTokenProgram: sevensTokenService.program.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = owner
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')
    }

    async getBuyTransaction(tokenPublicKey, buyerPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        const mint = new PublicKey(tokenPublicKey)
        const buyer = new PublicKey(buyerPublicKey)

        checkIsWalletAddress(mint)
        checkIsWalletAddress(buyer)

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
        const sellerTokenAccount = getAssociatedTokenAddressSync(mint, seller, false, TOKEN_PROGRAM_ID)
        const buyerTokenAccount = getAssociatedTokenAddressSync(mint, buyer, false, TOKEN_PROGRAM_ID)
        const salePda = this.getSalePda(tokenPublicKey)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedBuy(expectedPrice)
            .accounts({
                buyer,
                tariffs: tariffsPda,
                targetWallet,
                mint,
                tokenManagementData: tokenDataPda,
                seller,
                sellerTokenAccount,
                buyerTokenAccount,
                sale: salePda,
                saleAuthority: salePda,
                sevensTokenProgram: sevensTokenService.program.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = buyer
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')
    }

    async getBurnTransaction(tokenPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        const mint = new PublicKey(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)

        checkIsWalletAddress(mint)
        checkIsWalletAddress(owner)

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
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        }).toString('base64')
    }
}

module.exports = new ManageTokenService()
