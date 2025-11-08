const { PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js')
const { initializeProvider } = require('../utils/blockchain')

class WalletService {
    constructor() {
        const { connection } = initializeProvider()
        this.connection = connection
    }

    /**
     * Get balance of a wallet address in SOL
     * @param {string} walletAddress - The wallet public key
     * @returns {Promise<{balance: number, lamports: number}>}
     */
    async getBalance(walletAddress) {
        try {
            const publicKey = new PublicKey(walletAddress)
            const lamports = await this.connection.getBalance(publicKey)

            return  lamports ? lamports / LAMPORTS_PER_SOL : 0
        } catch (error) {
            throw new Error(`Failed to get wallet balance: ${error.message}`)
        }
    }
}

module.exports = new WalletService()
