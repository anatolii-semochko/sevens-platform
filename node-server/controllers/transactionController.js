const transactionService = require('../services/transactionService')
const { success, badRequest, badResponse, checkIsNotEmpty } = require('../utils/controller')

class TransactionController {
    async sendTransaction(req, res) {
        const { txSignature } = req.body

        try {
            checkIsNotEmpty(txSignature, 'txSignature')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await transactionService.sendTransaction(txSignature))
        } catch (error) {
            badResponse('Send transaction', res, req, error)
        }
    }

    async matchTransactionAndSignature(req, res) {
        const { transaction, txSignature } = req.body;

        try {
            checkIsNotEmpty(transaction, 'transaction')
            checkIsNotEmpty(txSignature, 'txSignature')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await transactionService.matchTransactionAndSignature(transaction, txSignature))
        } catch (error) {
            badResponse('Match transaction', res, req, error)
        }
    }
}

module.exports = new TransactionController()
