const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { loadIdl, initializeProvider, getPda, serializeTransaction} = require('../utils/blockchain')
const sevensTokenService = require('./sevensTokenService')
const tariffsService = require('./tariffsService')

class ManageTokenService {
    constructor() {
        loadIdl('SEVENS_TOKEN_MANAGEMENT_IDL_PATH').then(idl => {
            const { connection, provider, program } = initializeProvider(idl)
            this.connection = connection
            this.provider = provider
            this.managementProgram = program
        })
    }

    async getValidatedTokenData(tokenPublicKey) {
        let sevensTokenData
        try {
            sevensTokenData = await sevensTokenService.getTokenByPublicKey(tokenPublicKey)
        } catch (e) {
            throw new Error('Sevens token not found')
        }

        let managementData
        try {
            managementData = await this.getTokenManagementData(tokenPublicKey)
        } catch (e) {
            return null
        }

        // Validate price matches between TokenPDA and token.sale
        const tokenSalePrice = sevensTokenData.sale.priceLamports.toString()
        if (managementData.price !== tokenSalePrice) {
            throw new Error(`TokenPDA price (${managementData.price}) does not match token.sale.price (${tokenSalePrice})`)
        }

        // Calculate retailPrice = price + (price * saleFee / 100)
        const basePrice = BigInt(managementData.price)
        const saleFee = BigInt(managementData.saleFee)
        const feeAmount = (basePrice * saleFee) / BigInt(100)
        const retailPrice = (basePrice + feeAmount).toString()

        return {...managementData, retailPrice}
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
            const sevensTokenData = await sevensTokenService.getTokenByPublicKey(tokenPublicKey)
            const managementData = await this.getTokenManagementData(tokenPublicKey)

            if (!managementData) {
                return {
                    match: false,
                    mismatches: ['tokenAbsent'],
                }
            }

            const mismatches = []
            if (sevensTokenData.walletPublicKey !== managementData.owner) {
                mismatches.push('walletPublicKey')
            }
            if (sevensTokenData.sale.onSale !== managementData.onSale) {
                mismatches.push('onSale')
            }
            if (sevensTokenData.sale.priceLamports.toString() !== managementData.price) {
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
        const { author, hash, description, tokenName, canBeBurned } = mintParams

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

        // Get Sevens Token PDAs
        const { metadataPda, salePda, hashRegistryPda } = sevensTokenService.getSevensToken(mintPublicKey, hash)

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

    async getSetSaleTransaction(tokenPublicKey, price) {
        const mint = new PublicKey(tokenPublicKey)
        const ownerPublicKey = await sevensTokenService.getWalletPublicKeyByToken(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)

        const tariffs = await tariffsService.getTariffs()

        const tariffsPda = this.getTariffsPda()
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)
        const salePda = sevensTokenService.getSalePda(tokenPublicKey)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedSetSale(
                price > 0,
                new anchor.BN(price || 0),
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

        return serializeTransaction(tx)
    }

    async getBuyTransaction(tokenPublicKey, buyerPublicKey) {
        const mint = new PublicKey(tokenPublicKey)
        const buyer = new PublicKey(buyerPublicKey)

        const tariffs = await tariffsService.getTariffs()

        const tariffsPda = this.getTariffsPda()
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)
        const salePda = sevensTokenService.getSalePda(tokenPublicKey)

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

        return serializeTransaction(tx)
    }

    async getBurnTransaction(tokenPublicKey) {
        if (!this.managementProgram) {
            throw new Error('Management program not initialized. IDL not loaded.')
        }

        const mint = new PublicKey(tokenPublicKey)
        const owner = new PublicKey(ownerPublicKey)
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID)

        const tariffs = await tariffsService.getTariffs()

        const tariffsPda = this.getTariffsPda()
        const tokenDataPda = this.getTokenManagementDataPda(tokenPublicKey)

        // Build instruction
        const ix = await this.managementProgram.methods
            .managedBurn()
            .accounts({
                owner,
                tariffs: tariffsPda,
                targetWallet: new PublicKey(tariffs.targetWallet),
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

        return serializeTransaction(tx)
    }

    getTariffsPda = () => getPda(this.managementProgram.programId, 'tariffs')

    getTokenManagementDataPda = (tokenPublicKey) => getPda(
        this.managementProgram.programId,
        'token_data',
        new PublicKey(tokenPublicKey),
    )
}

module.exports = new ManageTokenService()
