const walletService = require('../services/walletService')

class WalletController {

    // GET /wallet/balance
    async getBalance(req, res) {
        try {
            const { walletAddress } = req.query

            if (!walletAddress) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'walletAddress query parameter is required',
                })
            }

            res.json({
                success: true,
                data: await walletService.getBalance(walletAddress),
            })
        } catch (error) {
            console.error('Error getting wallet balance:', error)
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message || 'Failed to get wallet balance',
            })
        }
    }
}

module.exports = new WalletController()
