const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { MPL_TOKEN_METADATA_PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata')
const { loadIdl, initializeProvider, getPda, serializeTransaction} = require('../utils/blockchain')
const { solToLamp, lampToSol } = require('../utils/currency')
const tokenService = require('./tokenService')
const tariffsService = require('./tariffsService')

class ManageTokenService {
    constructor() {
        loadIdl('HDT_MANAGEMENT_IDL_PATH').then(idl => {
            const { connection, provider, program } = initializeProvider(idl)
            this.connection = connection
            this.provider = provider
            this.managementProgram = program
        })
    }

    async getValidatedTokenData(tokenPublicKey) {
        const tokenData = await tokenService.getTokenByPublicKey(tokenPublicKey)
        const managementData = await this.getTokenManagementData(tokenPublicKey)

        // Validate price matches between TokenPDA and token.sale
        const tokenSalePrice = parseFloat(tokenData.sale.price)
        const managementPrice = lampToSol(managementData.price)
        if (Math.abs(tokenSalePrice - managementPrice) > 0.000000001) {
            throw new Error(`TokenPDA price (${managementPrice}) does not match token.sale.price (${tokenSalePrice})`)
        }

        // Calculate retailPrice = price + (price * saleFee / 100)
        const basePrice = lampToSol(managementData.price)
        const saleFee = managementData.saleFee
        const feeAmount = (basePrice * saleFee) / 100
        const retailPrice = basePrice + feeAmount

        return {...managementData, price: basePrice, retailPrice}
    }

    async getTokenManagementData(tokenPublicKey) {
        try {
            const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)
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
            const tokenData = await tokenService.getTokenByPublicKey(tokenPublicKey)
            const managementData = await this.getTokenManagementData(tokenPublicKey)

            if (!managementData) {
                return {
                    match: false,
                    mismatches: ['tokenAbsent'],
                }
            }

            const mismatches = []
            if (tokenData.walletPublicKey !== managementData.owner) {
                mismatches.push('walletPublicKey')
            }
            if (tokenData.sale.onSale !== managementData.onSale) {
                mismatches.push('onSale')
            }
            // Compare prices
            const managementPriceSol = lampToSol(managementData.price)
            if (Math.abs(tokenData.sale.price - managementPriceSol) > 0.000000001) {
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
        const managementData = await this.getTokenManagementData(tokenPublicKey)

        if (!managementData || !managementData.onSale) {
            return null
        }

        const basePrice = lampToSol(managementData.price)
        const feeAmount = (basePrice * managementData.saleFee) / 100

        return  basePrice + feeAmount
    }

    async getMintTransaction(walletPublicKey, mintPublicKey, mintParams) {
        const { author, hash, description, tokenName, canBeBurned, imageUri, collectionMint } = mintParams

        if (!hash || !tokenName) {
            throw new Error('Missing required mint parameters: hash, tokenName')
        }

        const payer = new PublicKey(walletPublicKey)
        const mint = new PublicKey(mintPublicKey)

        // Get PDAs
        const tariffsPda = this.getTariffsPda()
        const tariffs = await tariffsService.getTariffs()
        const targetWallet = new PublicKey(tariffs.targetWallet)
        const tokenAccount = getAssociatedTokenAddressSync(mint, payer, false, TOKEN_PROGRAM_ID)
        const tokenDataPda = this.getTokenManagementDataPda(mint.toString())

        // Get HD Token PDAs
        const { metadataPda, salePda, hashRegistryPda } = tokenService.getHDToken(mintPublicKey, hash)

        // Get Metaplex Metadata PDA
        const metaplexMetadataPda = this.getMetaplexPda(mintPublicKey)

        // Get collection mint from env or parameter
        const collectionMintPubkey = collectionMint
            ? new PublicKey(collectionMint)
            : (process.env.COLLECTION_MINT_PUBLIC_KEY ? new PublicKey(process.env.COLLECTION_MINT_PUBLIC_KEY) : null)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedMint(
                author || '',
                hash,
                description || '',
                tokenName,
                canBeBurned || false,
                imageUri || null,
                collectionMintPubkey
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
                metaplexMetadata: metaplexMetadataPda,
                metaplexMetadataProgram: new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
                tokenManagementData: tokenDataPda,
                sevensTokenProgram: tokenService.program.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([])
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = payer
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return {
            transaction: serializeTransaction(tx),
            mint: mint.toString(),
        }
    }

    async getSetSaleTransaction(tokenPublicKey, priceSol) {
        const mint = new PublicKey(tokenPublicKey)
        const ownerPublicKey = await tokenService.getWalletPublicKeyByToken(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)

        const tariffs = await tariffsService.getTariffs()

        const tariffsPda = this.getTariffsPda()
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)
        const salePda = tokenService.getSalePda(tokenPublicKey)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedSetSale(
                priceSol > 0,
                new anchor.BN(solToLamp(priceSol)),
            )
            .accounts({
                owner,
                tariffs: tariffsPda,
                targetWallet: new PublicKey(tariffs.targetWallet),
                mint,
                tokenAccount,
                tokenManagementData: tokenDataPda,
                sale: salePda,
                saleAuthority: salePda,
                sevensTokenProgram: tokenService.program.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = owner
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return serializeTransaction(tx)
    }

    async getBuyTransaction(tokenPublicKey, buyerPublicKey) {
        const mint = new PublicKey(tokenPublicKey)
        const buyer = new PublicKey(buyerPublicKey)

        const tariffs = await tariffsService.getTariffs()

        const tariffsPda = this.getTariffsPda()
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)
        const salePda = tokenService.getSalePda(tokenPublicKey)

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

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedBuy(expectedPrice)
            .accounts({
                buyer,
                tariffs: tariffsPda,
                targetWallet: new PublicKey(tariffs.targetWallet),
                mint,
                tokenManagementData: tokenDataPda,
                seller,
                sellerTokenAccount,
                buyerTokenAccount,
                sale: salePda,
                saleAuthority: salePda,
                sevensTokenProgram: tokenService.program.programId,
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

        return serializeTransaction(tx)
    }

    async getBurnTransaction(tokenPublicKey) {
        const tokenData = await tokenService.getTokenByPublicKey(tokenPublicKey)
        const ownerPublicKey = await tokenService.getWalletPublicKeyByToken(tokenPublicKey)
        const tariffs = await tariffsService.getTariffs()
        const mint = new PublicKey(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)
        const {
            metadataPda,
            salePda,
            hashRegistryPda,
        } = tokenService.getHDToken(tokenPublicKey, tokenData.metadata.hash)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedBurn()
            .accounts({
                owner,
                tariffs: this.getTariffsPda(),
                targetWallet: new PublicKey(tariffs.targetWallet),
                mint,
                tokenAccount,
                tokenManagementData: this.getTokenManagementDataPda(tokenPublicKey),
                metadata: metadataPda,
                sale: salePda,
                hashRegistry: hashRegistryPda,
                sevensTokenProgram: tokenService.program.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = owner
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return serializeTransaction(tx)
    }

    getTariffsPda = () => getPda(this.managementProgram.programId, 'tariffs')

    getTokenManagementDataPda = (tokenPublicKey) => getPda(
        this.managementProgram.programId,
        'token_data',
        new PublicKey(tokenPublicKey),
    )

    getMetaplexPda = (mintPublicKey) => {
        const mint = new PublicKey(mintPublicKey)
        const [metadataPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
                mint.toBuffer(),
            ],
            new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
        )
        return metadataPda
    }
}

module.exports = new ManageTokenService()
