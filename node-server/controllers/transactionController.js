const transactionService = require('../services/transactionService')
const { getAnchorErrorText } = require('../utils/blockchain')

class TransactionController {
    static async sendTransaction(req, res) {
        try {
            const { txSignature } = req.body;

            if (!txSignature) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'txSignature query parameter is required',
                })
            }

            res.json({
                success: true,
                data: await transactionService.sendTransaction(txSignature),
            })
        } catch (error) {
            console.error('Error sending transaction to blockchain:', error)
            res.status(400).json({
                error: 'Send transaction error',
                message: getAnchorErrorText(error),
            })
        }
    }

    static async matchTransactionAndSignature(req, res) {
        try {
            const { transaction, txSignature } = req.body;

            if (!transaction) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'transaction query parameter is required',
                })
            }

            if (!txSignature) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'txSignature query parameter is required',
                })
            }

            res.json({
                success: await transactionService.matchTransactionAndSignature(transaction, txSignature),
            })
        } catch (error) {
            console.error('Error matching transaction and signature:', error)
            res.status(400).json({
                error: error.message || 'Match transaction and signature error',
                message: error.message || getAnchorErrorText(error),
            })
        }
    }
}

module.exports = TransactionController
