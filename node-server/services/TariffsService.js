const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram } = require('@solana/web3.js')
const { loadIdl, initializeProvider } = require('../utils/blockchain')

class TariffsService {
    constructor() {
        const { connection, provider } = initializeProvider()
        this.connection = connection
        this.provider = provider

        this.sevensTokenManagementIdl = null
        this.program = null

        this.loadIdl().catch(e => console.error(`Sevens Token Management IDL loading error. Path: ${process.env.SEVENS_TOKEN_MANAGEMENT_IDL_PATH}.`, e))
    }

    async loadIdl() {
        try {
            const idlPath = process.env.SEVENS_TOKEN_MANAGEMENT_IDL_PATH
            if (!idlPath) {
                throw new Error('SEVENS_TOKEN_MANAGEMENT_IDL_PATH not set in environment')
            }

            this.sevensTokenManagementIdl = await loadIdl(idlPath)
            const programId = new PublicKey(this.sevensTokenManagementIdl.metadata.address)
            this.program = new anchor.Program(this.sevensTokenManagementIdl, programId, this.provider)

            console.log('✅ Sevens Token Management IDL loaded successfully')
            console.log(`   Program ID: ${programId.toString()}`)
        } catch (error) {
            console.error('Failed to load Sevens Token Management IDL:', error)
            throw error
        }
    }

    async getTariffs() {
        if (!this.program) {
            throw new Error('Program not initialized. IDL not loaded.')
        }

        // Derive PDA for tariffs
        const [tariffsPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('tariffs')],
            this.program.programId
        )

        // Fetch account data
        const tariffsAccount = await this.program.account.tariffsData.fetch(tariffsPda)

        return {
            authority: tariffsAccount.authority.toString(),
            targetWallet: tariffsAccount.targetWallet.toString(),
            mint: tariffsAccount.mint.toString(),
            setSale: tariffsAccount.setSale.toString(),
            buy: tariffsAccount.buy,
            burn: tariffsAccount.burn.toString(),
        }
    }

    async getSetTariffsTransaction(authorityPublicKey, targetWallet, mint, setSale, buy, burn) {
        if (!this.program) {
            throw new Error('Program not initialized. IDL not loaded.')
        }

        // Validate inputs
        if (!PublicKey.isOnCurve(authorityPublicKey)) {
            throw new Error('Invalid authority public key')
        }

        if (!PublicKey.isOnCurve(targetWallet)) {
            throw new Error('Invalid target wallet address')
        }

        if (mint < 0 || setSale < 0 || burn < 0) {
            throw new Error('Tariff values must be >= 0')
        }

        if (buy < 0 || buy >= 100) {
            throw new Error('Buy fee must be between 0 and 99')
        }

        const authority = new PublicKey(authorityPublicKey)
        const targetWalletPubkey = new PublicKey(targetWallet)

        // Derive PDA for tariffs
        const [tariffsPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('tariffs')],
            this.program.programId
        )

        // Check if tariffs account exists
        const tariffsAccountInfo = await this.connection.getAccountInfo(tariffsPda)
        const tariffsAccountExists = tariffsAccountInfo !== null

        // Build transaction - use initialize if account doesn't exist, updateTariffs otherwise
        let tx
        if (!tariffsAccountExists) {
            // First time initialization
            tx = await this.program.methods
                .initialize(
                    targetWalletPubkey,
                    new anchor.BN(mint),
                    new anchor.BN(setSale),
                    buy,
                    new anchor.BN(burn)
                )
                .accounts({
                    authority: authority,
                    tariffs: tariffsPda,
                    systemProgram: SystemProgram.programId,
                })
                .transaction()
        } else {
            // Update existing tariffs
            tx = await this.program.methods
                .updateTariffs(
                    targetWalletPubkey,
                    new anchor.BN(mint),
                    new anchor.BN(setSale),
                    buy,
                    new anchor.BN(burn)
                )
                .accounts({
                    authority: authority,
                    tariffs: tariffsPda,
                })
                .transaction()
        }

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.lastValidBlockHeight = lastValidBlockHeight
        tx.feePayer = authority

        // Serialize transaction
        const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        })

        return {
            transaction: serializedTx.toString('base64'),
            blockhash,
            lastValidBlockHeight,
        }
    }
}

module.exports = new TariffsService()
