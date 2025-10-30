const manageTokenService = require('../services/manageTokenService')
const sevensTokenService = require('../services/sevensTokenService')

class ManageTokenController {
    async getData(req, res) {
        try {
            const { tokenPublicKey } = req.query

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            // Get token data from blockchain (sevens-token)
            const tokenData = await sevensTokenService.getTokenByPublicKey(tokenPublicKey)

            if (!tokenData) {
                return res.status(404).json({
                    error: 'Token not found',
                    message: 'Token does not exist in blockchain',
                })
            }

            // Get management data from TokenManagementData PDA
            const managementData = await manageTokenService.getTokenManagementData(tokenPublicKey)

            if (!managementData) {
                // Token exists but not managed - return null
                return res.json(null)
            }

            // Validate price matches between TokenPDA and token.sale
            const tokenSalePrice = tokenData.sale.priceLamports.toString()
            if (managementData.price !== tokenSalePrice) {
                return res.status(409).json({
                    error: 'Token price wrong',
                    message: `TokenPDA price (${managementData.price}) does not match token.sale.price (${tokenSalePrice})`,
                })
            }

            // Calculate retailPrice = price + (price * saleFee / 100)
            const basePrice = BigInt(managementData.price)
            const saleFee = BigInt(managementData.saleFee)
            const feeAmount = (basePrice * saleFee) / BigInt(100)
            const retailPrice = (basePrice + feeAmount).toString()

            // Return management data with calculated retailPrice
            res.json({
                success: true,
                data: {...managementData, retailPrice},
            })
        } catch (error) {
            console.error('Error getting token management data:', error)
            res.status(500).json({
                error: 'Failed to get token management data',
                message: error.message,
            })
        }
    }

    async matchData(req, res) {
        try {
            const { tokenPublicKey } = req.query

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            res.json({
                success: true,
                data: await manageTokenService.matchTokenData(tokenPublicKey),
            })
        } catch (error) {
            console.error('Error matching token data:', error)
            res.status(500).json({
                error: 'Failed to match token data',
                message: error.message,
            })
        }
    }

    async getPrice(req, res) {
        try {
            const { tokenPublicKey } = req.query

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            res.json({
                success: true,
                data: await manageTokenService.getPriceWithFee(tokenPublicKey),
            })
        } catch (error) {
            console.error('Error getting price:', error)
            res.status(500).json({
                error: 'Failed to get price',
                message: error.message,
            })
        }
    }

    async getMintTransaction(req, res) {
        try {
            const { walletPublicKey, mintPublicKey, author, hash, description, tokenName, canBeBurned } = req.query

            // Validate required parameters
            if (!walletPublicKey) {
                return res.status(400).json({
                    error: 'Missing walletPublicKey parameter',
                })
            }

            if (!mintPublicKey) {
                return res.status(400).json({
                    error: 'Missing mintPublicKey parameter',
                })
            }

            if (!hash || !tokenName) {
                return res.status(400).json({
                    error: 'Missing required mint parameters',
                    message: 'Required: hash, tokenName',
                })
            }

            const mintParams = {
                tokenName,
                hash,
                author: author || '',
                description: description || '',
                canBeBurned: canBeBurned === 'true' || canBeBurned === '1' || canBeBurned === true,
            }

            const result = await manageTokenService.getMintTransaction(walletPublicKey, mintPublicKey, mintParams)

            res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            console.error('Error getting mint transaction:', error)
            res.status(500).json({
                error: 'Failed to get mint transaction',
                message: error.message,
            })
        }
    }

    async getSaleTransaction(req, res) {
        try {
            const { tokenPublicKey, price } = req.query

            // Validate required parameters
            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            if (price === undefined || price === null) {
                return res.status(400).json({
                    error: 'Missing price parameter',
                })
            }

            // Parse and validate price
            const priceValue = parseInt(price, 10)
            if (isNaN(priceValue) || priceValue < 0) {
                return res.status(400).json({
                    error: 'Invalid price',
                    message: 'Price must be a non-negative integer in lamports',
                })
            }

            // Get token owner
            const ownerPublicKey = await sevensTokenService.getWalletPublicKeyByToken(tokenPublicKey)

            if (!ownerPublicKey) {
                return res.status(404).json({
                    error: 'Token owner not found',
                    message: 'Could not determine token owner. Token may not exist or has invalid supply.',
                })
            }

            // Determine onSale status based on price
            const onSale = priceValue > 0

            res.json({
                success: true,
                data: await manageTokenService.getSetSaleTransaction(
                    tokenPublicKey,
                    ownerPublicKey,
                    onSale,
                    priceValue
                )
            })
        } catch (error) {
            console.error('Error getting sale transaction:', error)
            res.status(500).json({
                error: 'Failed to get sale transaction',
                message: error.message,
            })
        }
    }

    async getBuyTransaction(req, res) {
        try {
            const { tokenPublicKey, buyerPublicKey } = req.query

            // Validate required parameters
            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            if (!buyerPublicKey) {
                return res.status(400).json({
                    error: 'Missing buyerPublicKey parameter',
                })
            }

            // Get transaction
            const transaction = await manageTokenService.getBuyTransaction(
                tokenPublicKey,
                buyerPublicKey
            )

            res.json({
                success: true,
                data: transaction,
            })
        } catch (error) {
            console.error('Error getting buy transaction:', error)
            res.status(500).json({
                error: 'Failed to get buy transaction',
                message: error.message,
            })
        }
    }

    async getBurnTransaction(req, res) {
        try {
            const { tokenPublicKey } = req.body

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey',
                })
            }

            res.json({
                success: true,
                data: await manageTokenService.getBurnTransaction(tokenPublicKey),
            })
        } catch (error) {
            console.error('Error executing burn:', error)
            res.status(500).json({
                error: 'Failed to execute burn',
                message: error.message,
            })
        }
    }
}

module.exports = new ManageTokenController()
