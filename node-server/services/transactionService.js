const nacl = require('tweetnacl')
const { Transaction, VersionedTransaction } = require('@solana/web3.js')
const { commitment, initializeProvider, deserializeTransaction } = require("../utils/blockchain");

class TransactionService {
    constructor() {
        const { connection, provider } = initializeProvider()
        this.connection = connection
        this.provider = provider
    }

    async sendTransaction(txSignature) {
        const signature = await this.connection.sendRawTransaction(deserializeTransaction(txSignature), {
            skipPreflight: false,
            preflightCommitment: commitment,
        })

        return await this.connection.confirmTransaction({signature, commitment})
    }

    async matchTransactionAndSignature(transaction, txSignature) {
        try {
            // Parse unsigned transaction (original)
            const unsignedTransactionBuffer = deserializeTransaction(transaction)
            let unsignedTransaction
            try {
                unsignedTransaction = VersionedTransaction.deserialize(unsignedTransactionBuffer)
            } catch {
                unsignedTransaction = Transaction.from(unsignedTransactionBuffer)
            }

            // Parse signed transaction
            const signedTransactionBuffer = deserializeTransaction(txSignature)
            let signedTransaction
            try {
                signedTransaction = VersionedTransaction.deserialize(signedTransactionBuffer)
            } catch {
                signedTransaction = Transaction.from(signedTransactionBuffer)
            }

            // Get messages from transactions
            const originalMessage = unsignedTransaction.message.serialize()
            const signedMessage = signedTransaction.message.serialize()

            // Compare messages - they must be identical (except signatures)
            if (!originalMessage.equals(signedMessage)) {
                throw new Error('Wallet signature does not match transaction - signature is intended for a different or modified transaction')
            }

            // Get signatures from signed transaction
            const signatures = signedTransaction.signatures || []
            if (signatures.length === 0) {
                throw new Error('Signed transaction contains no signatures')
            }

            // Check if signed transaction has valid (non-empty) signatures
            let hasValidSignature = false
            for (const signature of signatures) {
                if (signature && !signature.every(byte => byte === 0)) {
                    hasValidSignature = true
                    break
                }
            }
            if (!hasValidSignature) {
                throw new Error('Signed transaction contains only empty signatures')
            }

            // Cryptographic verification: check if signature is valid for the message
            const signers = signedTransaction.message.staticAccountKeys || []
            if (signers.length > 0) {
                const firstSigner = signers[0] // Fee payer is typically the first signer
                const firstSignature = signatures[0] // First signature corresponds to first signer

                if (firstSignature && !firstSignature.every(byte => byte === 0)) {
                    const isValidSignature = nacl.sign.detached.verify(
                        originalMessage,
                        firstSignature,
                        firstSigner.toBytes()
                    )

                    if (!isValidSignature) {
                        throw new Error('Signature is cryptographically invalid for this transaction')
                    }
                }
            }
        } catch (error) {
            if (error.message.includes('Signature') || error.message.includes('signature') || error.message.includes('Transaction')) {
                throw error
            }
            throw new Error(`Error verifying transaction signature: ${error.message}`)
        }
    }
}

// Export singleton instance
module.exports = new TransactionService()
