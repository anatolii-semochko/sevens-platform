const walletService = require('../services/walletService')
const {
    success,
    badRequest,
    badResponse ,
    checkIsNotEmpty ,
    checkIsWalletAddress,
} = require('../utils/controller')

class WalletController {

    async getBalance(req, res) {
        const { walletAddress } = req.query

        try {
            checkIsNotEmpty(walletAddress, 'walletAddress')
            checkIsWalletAddress(walletAddress, 'walletAddress')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await walletService.getBalance(walletAddress))
        } catch (error) {
            badResponse('Get wallet balance', res, req, error)
        }
    }
}

module.exports = new WalletController()
