const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { loadIdl, initializeProvider, serializeTransaction, getPda } = require('../utils/blockchain')
const { lampToSol, solToLamp } = require('../utils/currency')

class TariffsService {
    constructor() {
        loadIdl('SEVENS_TOKEN_MANAGEMENT_IDL_PATH').then(idl => {
            const { connection, provider, program} = initializeProvider(idl)
            this.connection = connection
            this.provider = provider
            this.program = program
        })
    }

    async getTariffs() {
        const tariffsPda = this.getTariffsPda()

        // Check if account exists first
        const accountInfo = await this.connection.getAccountInfo(tariffsPda)
        if (!accountInfo) {
            return null
        }

        // Fetch account data
        const tariffsAccount = await this.program.account.tariffsData.fetch(tariffsPda)

        return {
            authority: tariffsAccount.authority.toString(),
            targetWallet: tariffsAccount.targetWallet.toString(),
            mint: lampToSol(tariffsAccount.mint.toString()),
            setSale: lampToSol(tariffsAccount.setSale.toString()),
            buy: tariffsAccount.buy,
            burn: lampToSol(tariffsAccount.burn.toString()),
            paused: tariffsAccount.paused,
        }
    }

    async getSetTariffsTransaction(
        authorityPublicKey,
        targetWallet,
        mintSol,
        setSaleSol,
        buy,
        burnSol,
        paused,
    ) {
        // Validate inputs
        if (!PublicKey.isOnCurve(authorityPublicKey)) {
            throw new Error('Invalid authority public key')
        }

        if (!PublicKey.isOnCurve(targetWallet)) {
            throw new Error('Invalid target wallet address')
        }

        if (mintSol < 0 || setSaleSol < 0 || burnSol < 0) {
            throw new Error('Tariff values must be >= 0')
        }

        if (buy < 0 || buy >= 100) {
            throw new Error('Buy fee must be between 0 and 99')
        }

        if (typeof paused !== 'boolean') {
            throw new Error('Paused must be a boolean value')
        }

        const authority = new PublicKey(authorityPublicKey)
        const targetWalletPubkey = new PublicKey(targetWallet)

        const tariffsPda = this.getTariffsPda()

        // Check if tariffs account exists
        const tariffsAccountInfo = await this.connection.getAccountInfo(tariffsPda)
        const tariffsAccountExists = tariffsAccountInfo !== null

        // Build instructions
        const tx = new Transaction()

        if (!tariffsAccountExists) {
            // First time initialization
            const initIx = await this.program.methods
                .initialize(
                    targetWalletPubkey,
                    new anchor.BN(solToLamp(mintSol)),
                    new anchor.BN(solToLamp(setSaleSol)),
                    buy,
                    new anchor.BN(solToLamp(burnSol))
                )
                .accounts({
                    authority: authority,
                    tariffs: tariffsPda,
                    systemProgram: SystemProgram.programId,
                })
                .instruction()
            tx.add(initIx)
        } else {
            // Update existing tariffs
            const updateIx = await this.program.methods
                .updateTariffs(
                    targetWalletPubkey,
                    new anchor.BN(solToLamp(mintSol)),
                    new anchor.BN(solToLamp(setSaleSol)),
                    buy,
                    new anchor.BN(solToLamp(burnSol))
                )
                .accounts({
                    authority: authority,
                    tariffs: tariffsPda,
                })
                .instruction()
            tx.add(updateIx)
        }

        // Add setPaused instruction
        const setPausedIx = await this.program.methods
            .setPaused(paused)
            .accounts({
                authority: authority,
                tariffs: tariffsPda,
            })
            .instruction()
        tx.add(setPausedIx)

        // Set transaction metadata
        tx.feePayer = authority
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return serializeTransaction(tx)
    }

    getTariffsPda() {
        return getPda(this.program.programId, 'tariffs')
    }
}

module.exports = new TariffsService()
