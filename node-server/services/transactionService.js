const nacl = require('tweetnacl')
const { Transaction, VersionedTransaction, ComputeBudgetProgram } = require('@solana/web3.js')
const { commitment, initializeProvider, deserializeTransaction } = require('../utils/blockchain')

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
            const unsignedTransactionBuffer = deserializeTransaction(transaction)
            let unsignedTransaction
            try {
                unsignedTransaction = VersionedTransaction.deserialize(unsignedTransactionBuffer)
            } catch {
                unsignedTransaction = Transaction.from(unsignedTransactionBuffer)
            }

            const signedTransactionBuffer = deserializeTransaction(txSignature)
            let signedTransaction
            try {
                signedTransaction = VersionedTransaction.deserialize(signedTransactionBuffer)
            } catch {
                signedTransaction = Transaction.from(signedTransactionBuffer)
            }

            const originalMessage = unsignedTransaction.message.serialize()
            const signedMessage = signedTransaction.message.serialize()

            // Allow wallet to add ComputeBudget instructions (e.g., Phantom in Firefox)
            if (!originalMessage.equals(signedMessage)) {
                const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId.toString()

                const originalInstructions = unsignedTransaction.message.compiledInstructions || []
                const signedInstructions = signedTransaction.message.compiledInstructions || []

                // Filter out ComputeBudget instructions
                const filterComputeBudget = (instructions, accountKeys) => {
                    return instructions.filter(ix => {
                        const programId = accountKeys[ix.programIdIndex]
                        return programId.toString() !== COMPUTE_BUDGET_PROGRAM_ID
                    })
                }

                const originalAccountKeys = unsignedTransaction.message.staticAccountKeys || unsignedTransaction.message.accountKeys || []
                const signedAccountKeys = signedTransaction.message.staticAccountKeys || signedTransaction.message.accountKeys || []

                const filteredOriginal = filterComputeBudget(originalInstructions, originalAccountKeys)
                const filteredSigned = filterComputeBudget(signedInstructions, signedAccountKeys)

                // Verify non-ComputeBudget instructions count matches
                if (filteredOriginal.length !== filteredSigned.length) {
                    throw new Error('Wallet signature does not match transaction - signature is intended for a different or modified transaction')
                }

                // Verify fee payer was not modified
                if (originalAccountKeys[0]?.toString() !== signedAccountKeys[0]?.toString()) {
                    throw new Error('Wallet signature does not match transaction - fee payer was modified')
                }

                // Verify blockhash was not modified
                if (unsignedTransaction.message.recentBlockhash !== signedTransaction.message.recentBlockhash) {
                    throw new Error('Wallet signature does not match transaction - blockhash was modified')
                }
            }

            const signatures = signedTransaction.signatures || []
            if (signatures.length === 0) {
                throw new Error('Signed transaction contains no signatures')
            }

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

            // Verify signature cryptographically
            const signers = signedTransaction.message.staticAccountKeys || []
            if (signers.length > 0) {
                const firstSigner = signers[0]
                const firstSignature = signatures[0]

                if (firstSignature && !firstSignature.every(byte => byte === 0)) {
                    // Verify signature against signed message (which may include ComputeBudget instructions)
                    const isValidSignature = nacl.sign.detached.verify(
                        signedMessage,
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
