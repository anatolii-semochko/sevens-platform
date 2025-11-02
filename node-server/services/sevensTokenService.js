const crypto = require('crypto')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { commitment, loadIdl, initializeProvider, getPda, serializeTransaction } = require('../utils/blockchain')
const { lampToSevens } = require('../utils/currency')

class SevensTokenService {
    constructor() {
        loadIdl('SEVENS_TOKEN_IDL_PATH').then(idl => {
            const { connection, provider, program} = initializeProvider(idl)
            this.connection = connection
            this.provider = provider
            this.program = program
        })
    }

    async getWalletPublicKeyByToken(tokenPublicKey) {
        let walletPublicKey = null

        const publicKey = new PublicKey(tokenPublicKey)
        const mintInfo = await this.connection.getParsedAccountInfo(publicKey)
        const supply = mintInfo?.value?.data?.parsed?.info?.supply

        if (supply === '1') {
            // For NFT (supply = 1), find the token account holder
            const tokenAccounts = await this.connection.getTokenLargestAccounts(publicKey)
            if (tokenAccounts?.value?.length > 0) {
                const largestAccount = tokenAccounts.value[0]
                const tokenAccountInfo = await this.connection.getParsedAccountInfo(largestAccount.address)
                walletPublicKey = tokenAccountInfo?.value?.data?.parsed?.info?.owner
            }
        }

        return walletPublicKey
    }

    async getTokenByPublicKey(tokenPublicKey){
        const walletPublicKey = await this.getWalletPublicKeyByToken(tokenPublicKey)
        const { metadataPda, salePda } = this.getSevensToken(new PublicKey(tokenPublicKey))
        const metadata = await this.program.account.trustDataMetadata.fetch(metadataPda)
        const sale = await this.program.account.tokenSaleData.fetch(salePda)
        sale.price = lampToSevens(sale.price.toNumber())

        return {
            tokenPublicKey,
            walletPublicKey,
            mintingTime: new Date(metadata.timestamp.toNumber() * 1000).toISOString(),
            metadata,
            sale,
        }
    }

    async getTokenByHash(hash) {
        const hashRegistryPda = this.getHashPda(hash)
        const hashRegistry = await this.program.account.hashRegistry.fetch(hashRegistryPda)
        const mintPublicKey = hashRegistry.mintKey.toString()

        return await this.getTokenByPublicKey(mintPublicKey)
    }

    async getAgeMinutes(publicKey) {
        const tokenData = await this.getTokenByPublicKey(publicKey)
        const blockchainTimestamp = tokenData.metadata.timestamp.toNumber()
        const currentTimeSeconds = Math.floor(Date.now() / 1000)
        const ageInSeconds = currentTimeSeconds - blockchainTimestamp
        const ageInMinutes = Math.floor(ageInSeconds / 60)

        return Math.max(0, ageInMinutes)
    }

    async getBuyTransaction(tokenPublicKey, buyerPublicKey) {
        const mint = new PublicKey(tokenPublicKey)
        const buyer = new PublicKey(buyerPublicKey)
        const tokenData = await this.getTokenByPublicKey(tokenPublicKey)
        const owner = await this.getTokenOwner(mint)
        const buyerToken = getAssociatedTokenAddressSync(mint, buyer, false, TOKEN_PROGRAM_ID)
        const { salePda } = this.getSevensToken(mint)

        const ix = await this.program.methods
            .buyToken(tokenData.sale.price)
            .accounts({
                buyerAccount: buyer,
                ownerAccount: owner.publicKey,
                buyerTokenAccount: buyerToken,
                ownerTokenAccount: owner.tokenAccount,
                mint,
                sale: salePda,
                saleAuthority: salePda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .instruction()

        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = buyer
        tx.recentBlockhash = (await this.connection.getLatestBlockhash(commitment)).blockhash

        return serializeTransaction(tx)
    }

    async getBurnTransaction(tokenPublicKey) {
        const tokenData = await this.getTokenByPublicKey(tokenPublicKey)
        const mint = new PublicKey(tokenPublicKey)
        const payerPublicKey = new PublicKey(tokenData.walletPublicKey)
        const tokenAccount = getAssociatedTokenAddressSync(mint, payerPublicKey, false, TOKEN_PROGRAM_ID)
        const { metadataPda, salePda, hashRegistryPda } = this.getSevensToken(mint, tokenData.metadata.hash)

        const burnIx = await this.program.methods
            .burnToken()
            .accounts({
                mint,
                tokenAccount,
                metadata: metadataPda,
                sale: salePda,
                hashRegistry: hashRegistryPda,
                payerAccount: payerPublicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()

        const tx = new Transaction().add(burnIx)
        tx.feePayer = payerPublicKey
        tx.recentBlockhash = (await this.connection.getLatestBlockhash(commitment)).blockhash

        return serializeTransaction(tx)
    }

    async getTokenOwner(tokenPublicKey) {
        const largestAccounts = await this.connection.getTokenLargestAccounts(tokenPublicKey)
        const largestAccountInfo = largestAccounts.value[0]
        if (!largestAccountInfo) {
            throw new Error('No token accounts found for this mint.')
        }
        const parsedAccount = await this.connection.getParsedAccountInfo(largestAccountInfo.address)
        const owner = new PublicKey(parsedAccount.value.data.parsed.info.owner)

        return {
            tokenAccount: largestAccountInfo.address,
            publicKey: owner,
        }
    }

    getSevensToken (publicKey, hash = null){
        const pubKey = publicKey ? new PublicKey(publicKey) : null
        return {
            metadataPda: pubKey ? this.getMetadataPda(pubKey) : null,
            salePda: pubKey ? this.getSalePda(pubKey) : null,
            hashRegistryPda: hash ? this.getHashPda(hash) : null,
        }
    }

    getMetadataPda = (tokenPublicKey) => getPda(this.program.programId, 'metadata', new PublicKey(tokenPublicKey))

    getSalePda = (tokenPublicKey) => getPda(this.program.programId, 'sale', new PublicKey(tokenPublicKey))

    getHashPda = (hash) => {
        try {
            const hashOfHash = crypto.createHash('sha256').update(hash).digest()
            const shortHashBuffer = hashOfHash.slice(0, 28)
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from('hash'), shortHashBuffer],
                new PublicKey(this.program.programId),
            )

            return pda
        } catch (error) {
            console.error('Error getting hash PDA:', error)
            return null
        }
    }
}

// Export singleton instance
module.exports = new SevensTokenService()
