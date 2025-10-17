const { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction} = require('@solana/web3.js')
const { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { getPda, getAnchorErrorText } = require('../utils/blockchain')
const anchor = require('@coral-xyz/anchor')
const crypto = require('crypto')

class SevensTokenService {
    constructor() {
        this.connection = new Connection(
            process.env.ANCHOR_PROVIDER_URL,
            'confirmed',
        )

        this.dummyWallet = {
            publicKey: PublicKey.default,
            signAllTransactions: async (txs) => txs,
            signTransaction: async (tx) => tx,
        }

        this.provider = new anchor.AnchorProvider(
            this.connection,
            this.dummyWallet,
            { commitment: 'confirmed' },
        )

        this.sevensIdl = null
        this.program = null

        this.loadIdl().catch(e => console.error(`IDL loading error. Path: ${process.env.SEVENS_TOKEN_IDL_PATH}.`, e))
    }

    async loadIdl() {
        try {
            const idlPath = process.env.SEVENS_TOKEN_IDL_PATH
            if (!idlPath) {
                console.error('SEVENS_TOKEN_IDL_PATH not set in environment')
                return
            }

            // Fetch IDL for development, ignore SSL certificate errors
            let response
            if (process.env.NODE_ENV === 'development' && idlPath.startsWith('https:')) {
                // Use https module directly for better SSL control
                const https = require('https')
                const { URL } = require('url')

                const url = new URL(idlPath)
                const options = {
                    hostname: url.hostname,
                    port: url.port || 443,
                    path: url.pathname + url.search,
                    method: 'GET',
                    rejectUnauthorized: false, // Ignore self-signed certificates
                }

                const data = await new Promise((resolve, reject) => {
                    const req = https.request(options, (res) => {
                        let data = ''
                        res.on('data', chunk => data += chunk)
                        res.on('end', () => resolve({ ok: res.statusCode === 200, text: () => Promise.resolve(data) }))
                    })
                    req.on('error', reject)
                    req.end()
                })

                response = data
            } else {
                response = await fetch(idlPath)
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch IDL: ${response.statusText || 'Request failed'}`)
            }

            const jsonText = typeof response.text === 'function' ? await response.text() : response.text
            this.sevensIdl = JSON.parse(jsonText)
            console.log('IDL loaded successfully')

            if (this.sevensIdl && this.sevensIdl.metadata && this.sevensIdl.metadata.address) {
                this.program = new anchor.Program(
                    this.sevensIdl,
                    this.sevensIdl.metadata.address,
                    this.provider,
                )
                console.log('Anchor program initialized')
            } else {
                console.error('Invalid IDL structure - missing metadata.address')
            }
        } catch (error) {
            console.error('Error loading IDL:', error.message)
        }
    }

    getHashPda(programId, hash) {
        try {
            const hashOfHash = crypto.createHash('sha256').update(hash).digest()
            const shortHashBuffer = hashOfHash.slice(0, 28)
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from('hash'), shortHashBuffer],
                new PublicKey(programId),
            )
            return pda
        } catch (error) {
            console.error('Error getting hash PDA:', error)
            return null
        }
    }

    async getWalletPublicKeyByToken(tokenPublicKey) {
        let walletPublicKey = null
        try {
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
        } catch (walletError) {
            throw new Error(getAnchorErrorText(walletError))
        }
    }

    async getTokenByPublicKey(tokenPublicKey){
        try {
            const publicKey = new PublicKey(tokenPublicKey)
            const {
                program,
                metadataPda,
                salePda,
            } = this.getSevensToken(publicKey)

            const metadata = await program.account.trustDataMetadata.fetch(metadataPda)
            const sale = await program.account.tokenSaleData.fetch(salePda)

            sale.priceLamports = sale.price.toNumber()
            sale.priceSevens = sale.price.toNumber() / LAMPORTS_PER_SOL

            const walletPublicKey = await this.getWalletPublicKeyByToken(tokenPublicKey)

            return {
                tokenPublicKey,
                walletPublicKey,
                mintingTime: new Date(metadata.timestamp.toNumber() * 1000).toISOString(),
                metadata,
                sale,
            }
        } catch (error) {
            throw new Error(getAnchorErrorText(error))
        }
    }

    async getTokenByHash(hash) {
        try {
            const { program } = this.getSevensToken(null, hash)
            const hashRegistryPda = this.getHashPda(program.programId, hash)
            const hashRegistry = await program.account.hashRegistry.fetch(hashRegistryPda)
            const mintPublicKey = hashRegistry.mintKey.toString()

            return await this.getTokenByPublicKey(mintPublicKey)
        } catch (error) {
            console.error('Error getting token by hash:', error)
            throw new Error('Token not found')
        }
    }

    async getAgeMinutes(publicKey) {
        try {
            const tokenData = await this.getTokenByPublicKey(publicKey)
            const blockchainTimestamp = tokenData.metadata.timestamp.toNumber()
            const currentTimeSeconds = Math.floor(Date.now() / 1000)
            const ageInSeconds = currentTimeSeconds - blockchainTimestamp
            const ageInMinutes = Math.floor(ageInSeconds / 60)

            return Math.max(0, ageInMinutes)
        } catch (error) {
            throw new Error(`Failed to calculate token age: ${error.message}`)
        }
    }

    async getBuyTransaction(tokenPublicKey, buyerPublicKey) {
        try {
            const tokenData = await this.getTokenByPublicKey(tokenPublicKey)

            const mint = new PublicKey(tokenPublicKey)
            const buyer = new PublicKey(buyerPublicKey)
            const {
                program,
                salePda,
            } = this.getSevensToken(mint)

            const owner = await this.getTokenOwner(mint)
            const buyerToken = getAssociatedTokenAddressSync(mint, buyer, false, TOKEN_PROGRAM_ID)

            const ix = await program.methods
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

            const { blockhash } = await this.connection.getLatestBlockhash('confirmed')
            const tx = new Transaction()
            tx.add(ix)
            tx.feePayer = buyer
            tx.recentBlockhash = blockhash

            return tx
        } catch (error) {
            console.error('Raw error in getBuyTransaction:', error)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
            throw error
        }
    }

    getSevensToken (publicKey, hash = null){
        if (!this.sevensIdl || !this.sevensIdl.metadata || !this.sevensIdl.metadata.address) {
            throw new Error('IDL not loaded or invalid')
        }

        const program = new anchor.Program(this.sevensIdl, this.sevensIdl.metadata.address, this.provider)
        const pubKey = publicKey ? new PublicKey(publicKey) : null
        return {
            sevensIdl: this.sevensIdl,
            program,
            metadataPda: pubKey ? getPda(program.programId, 'metadata', pubKey) : null,
            salePda: pubKey ? getPda(program.programId, 'sale', pubKey) : null,
            hashRegistryPda: hash ? this.getHashPda(program.programId, hash) : null,
        }
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
}

// Export singleton instance
module.exports = new SevensTokenService()
