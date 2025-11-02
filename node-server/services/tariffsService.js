const anchor = require('@coral-xyz/anchor')
const { PublicKey, SystemProgram, Transaction } = require('@solana/web3.js')
const { loadIdl, initializeProvider, serializeTransaction, getPda } = require('../utils/blockchain')
const { lampToSevens, sevensToLamp } = require('../utils/currency')

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
            mint: lampToSevens(tariffsAccount.mint.toString()),
            setSale: lampToSevens(tariffsAccount.setSale.toString()),
            buy: tariffsAccount.buy,
            burn: lampToSevens(tariffsAccount.burn.toString()),
            paused: tariffsAccount.paused,
        }
    }

    async getSetTariffsTransaction(authorityPublicKey, targetWallet, mintSevens, setSaleSevens, buy, burnSevens) {
        // Validate inputs
        if (!PublicKey.isOnCurve(authorityPublicKey)) {
            throw new Error('Invalid authority public key')
        }

        if (!PublicKey.isOnCurve(targetWallet)) {
            throw new Error('Invalid target wallet address')
        }

        if (mintSevens < 0 || setSaleSevens < 0 || burnSevens < 0) {
            throw new Error('Tariff values must be >= 0')
        }

        if (buy < 0 || buy >= 100) {
            throw new Error('Buy fee must be between 0 and 99')
        }

        const authority = new PublicKey(authorityPublicKey)
        const targetWalletPubkey = new PublicKey(targetWallet)

        const tariffsPda = this.getTariffsPda()

        // Check if tariffs account exists
        const tariffsAccountInfo = await this.connection.getAccountInfo(tariffsPda)
        const tariffsAccountExists = tariffsAccountInfo !== null

        // Build instruction - use initialize if account doesn't exist, updateTariffs otherwise
        let ix
        if (!tariffsAccountExists) {
            // First time initialization
            ix = await this.program.methods
                .initialize(
                    targetWalletPubkey,
                    new anchor.BN(sevensToLamp(mintSevens)),
                    new anchor.BN(sevensToLamp(setSaleSevens)),
                    buy,
                    new anchor.BN(sevensToLamp(burnSevens))
                )
                .accounts({
                    authority: authority,
                    tariffs: tariffsPda,
                    systemProgram: SystemProgram.programId,
                })
                .instruction()
        } else {
            // Update existing tariffs
            ix = await this.program.methods
                .updateTariffs(
                    targetWalletPubkey,
                    new anchor.BN(sevensToLamp(mintSevens)),
                    new anchor.BN(sevensToLamp(setSaleSevens)),
                    buy,
                    new anchor.BN(sevensToLamp(burnSevens))
                )
                .accounts({
                    authority: authority,
                    tariffs: tariffsPda,
                })
                .instruction()
        }

        // Create transaction
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = authority
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

        return serializeTransaction(tx)
    }

    getTariffsPda() {
        return getPda(this.program.programId, 'tariffs')
    }
}

module.exports = new TariffsService()
