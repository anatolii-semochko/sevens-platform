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
            res.status(404).json({
                error: 'Send transaction error',
                message: getAnchorErrorText(error),
            })
        }
    }
}

module.exports = TransactionController
