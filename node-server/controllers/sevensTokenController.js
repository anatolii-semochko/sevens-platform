const tokenService = require('../services/sevensTokenService')
const { getAnchorErrorText } = require('../utils/blockchain')

class SevensTokenController {
    static async getTokens(req, res) {
        try {
            const { publicKey, hash } = req.query

            if (publicKey) {
                return await SevensTokenController.getByPublicKey(publicKey, res)
            }

            if (hash) {
                return await SevensTokenController.getByHash(hash, res)
            }

            res.status(400).json({
                error: 'Bad Request',
                message: 'Either publicKey or hash query parameter is required',
            })
        } catch (error) {
            console.error('Error in getTokens:', error)
            res.status(404).json({
                error: 'Failed to retrieve token data',
                message: getAnchorErrorText(error),
            })
        }
    }

    static async getByPublicKey(publicKey, res) {
        try {
            if (!publicKey) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'publicKey query parameter is required',
                })
            }

            res.json({
                success: true,
                data: await tokenService.getTokenByPublicKey(publicKey),
            })
        } catch (error) {
            console.error('Error getting token by public key:', error)
            res.status(404).json({
                error: 'Token not found',
                message: getAnchorErrorText(error),
            })
        }
    }

    static async getByHash(hash, res) {
        try {
            if (!hash) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Hash query parameter is required',
                })
            }

            res.json({
                success: true,
                data: await tokenService.getTokenByHash(hash),
            })
        } catch (error) {
            console.error('Error getting token by hash:', error)
            res.status(404).json({
                error: 'Token not found',
                message: getAnchorErrorText(error),
            })
        }
    }

    static async getAgeMinutes(req, res) {
        try {
            const { publicKey } = req.query

            if (!publicKey) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'publicKey query parameter is required',
                })
            }

            const ageMinutes = await tokenService.getAgeMinutes(publicKey)

            res.json({
                success: true,
                data: ageMinutes,
            })
        } catch (error) {
            console.error('Error getting token age:', error)
            res.status(404).json({
                error: 'Failed to get token age',
                message: getAnchorErrorText(error),
            })
        }
    }

    static async getBuyTransaction(req, res) {
        try {
            const { tokenPublicKey, buyerPublicKey } = req.query

            if (!tokenPublicKey || !buyerPublicKey) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Both tokenPublicKey and buyerPublicKey query parameters are required',
                })
            }

            res.json({
                success: true,
                data: await tokenService.getBuyTransaction(tokenPublicKey, buyerPublicKey),
            })
        } catch (error) {
            console.error('Error getting sevens token buy transaction:', error)
            res.status(404).json({
                error: 'Failed to create transaction',
                message: getAnchorErrorText(error),
            })
        }
    }
}

module.exports = SevensTokenController
