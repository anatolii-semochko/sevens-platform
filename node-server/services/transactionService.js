const anchor = require('@coral-xyz/anchor')
const { Connection } = require('@solana/web3.js')

const commitment = 'confirmed'

class TransactionService {
    constructor() {
        this.connection = new Connection(process.env.ANCHOR_PROVIDER_URL, commitment)
        this.provider = new anchor.AnchorProvider(this.connection, { commitment })
    }

    async sendTransaction(txSignature) {
        const signature = await this.connection.sendRawTransaction(Buffer.from(txSignature, 'base64'), {
            skipPreflight: false,
            preflightCommitment: commitment,
        })

        return await this.connection.confirmTransaction({signature, commitment})
    }
}

// Export singleton instance
module.exports = new TransactionService()
