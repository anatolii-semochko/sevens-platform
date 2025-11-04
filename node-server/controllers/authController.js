const authService = require('../services/authService')
const {
    success,
    badRequest,
    badResponse,
    checkIsNotEmpty,
    checkIsWalletAddress,
} = require('../utils/controller')

class AuthController {
    async getNonce(req, res) {
        const { walletAddress } = req.query

        try {
            checkIsNotEmpty(walletAddress, 'walletAddress')
            checkIsWalletAddress(walletAddress, 'walletAddress')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await authService.createNonce(walletAddress))
        } catch (error) {
            badResponse('Get nonce', res, req , error)
        }
    }

    async verifySignature(req, res) {
        const { walletAddress, signature, nonce } = req.body

        try {
            checkIsNotEmpty(walletAddress, 'walletAddress')
            checkIsWalletAddress(walletAddress, 'walletAddress')
            checkIsNotEmpty(signature, 'signature')
            checkIsNotEmpty(nonce, 'nonce')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await authService.verifySignature(walletAddress, signature, nonce))
        } catch (error) {
            badResponse('Verify nonce', res, req , error)
        }
    }
}

module.exports = new AuthController()
