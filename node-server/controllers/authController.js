const authService = require('../services/authService')

class AuthController {

    // GET /auth/nonce
    static async getNonce(req, res) {
        try {
            const { walletAddress } = req.query

            if (!walletAddress) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'walletAddress query parameter is required',
                })
            }

            const nonceData = await authService.createNonce(walletAddress)

            res.json({
                success: true,
                data: {
                    nonce: nonceData.nonce,
                    message: nonceData.message,
                    expiresAt: nonceData.expiresAt,
                },
            })
        } catch (error) {
            console.error('Error generating nonce:', error)
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message || 'Failed to generate nonce',
            })
        }
    }

    // POST /auth/verify
    static async verifySignature(req, res) {
        try {
            const { walletAddress, signature, nonce } = req.body

            if (!walletAddress || !signature || !nonce) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'WalletAddress, signature, and nonce are required',
                })
            }

            const result = await authService.verifySignature(walletAddress, signature, nonce)

            res.json({
                success: true,
                data: {
                    authenticated: true,
                    walletAddress: result.walletAddress,
                    verifiedAt: result.verifiedAt,
                },
            })
        } catch (error) {
            console.error('Error verifying signature:', error)
            res.status(401).json({
                error: 'Unauthorized',
                message: error.message || 'Failed to verify signature'
            })
        }
    }
}

module.exports = AuthController
