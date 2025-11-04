const crypto = require('crypto')
const { PublicKey } = require('@solana/web3.js')
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { loadIdl, initializeProvider, getPda } = require('../utils/blockchain')
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

    async getTokenByWallet(walletPublicKey){
        const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
            new PublicKey(walletPublicKey),
            {programId: TOKEN_PROGRAM_ID},
        )

        const tokens = []
        for (const accountInfo of tokenAccounts.value) {
            const accountData = accountInfo.account.data.parsed.info
            const amount = parseInt(accountData.tokenAmount.amount, 10)
            const decimals = parseInt(accountData.tokenAmount.decimals, 10)
            if (amount === 1 && decimals === 0) {
                tokens.push(accountData.mint)
            }
        }

        return tokens
    }

    async getAgeMinutes(publicKey) {
        const tokenData = await this.getTokenByPublicKey(publicKey)
        const blockchainTimestamp = tokenData.metadata.timestamp.toNumber()
        const currentTimeSeconds = Math.floor(Date.now() / 1000)
        const ageInSeconds = currentTimeSeconds - blockchainTimestamp
        const ageInMinutes = Math.floor(ageInSeconds / 60)

        return Math.max(0, ageInMinutes)
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
