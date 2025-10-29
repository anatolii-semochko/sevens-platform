const tariffsService = require('../services/TariffsService')
const { getAnchorErrorText } = require('../utils/blockchain')

class TariffsController {
    async getTariffs(req, res) {
        try {
            const result = await tariffsService.getTariffs()

            res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            console.error('Error fetching tariffs:', error)
            res.status(500).json({
                error: 'Failed to fetch tariffs',
                message: getAnchorErrorText(error),
            })
        }
    }

    async getTransaction(req, res) {
        try {
            const { authorityPublicKey, targetWallet, mint, setSale, buy, burn } = req.query

            // Validate required parameters
            if (!authorityPublicKey || !targetWallet || mint === undefined || setSale === undefined || buy === undefined || burn === undefined) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'All parameters are required: authorityPublicKey, targetWallet, mint, setSale, buy, burn',
                })
            }

            // Convert string parameters to numbers
            const mintValue = parseInt(mint, 10)
            const setSaleValue = parseInt(setSale, 10)
            const buyValue = parseInt(buy, 10)
            const burnValue = parseInt(burn, 10)

            // Validate conversions
            if (isNaN(mintValue) || isNaN(setSaleValue) || isNaN(buyValue) || isNaN(burnValue)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid number format for tariff values',
                })
            }

            const result = await tariffsService.getSetTariffsTransaction(
                authorityPublicKey,
                targetWallet,
                mintValue,
                setSaleValue,
                buyValue,
                burnValue
            )

            res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            console.error('Error creating tariffs transaction:', error)
            res.status(500).json({
                error: 'Failed to create transaction',
                message: getAnchorErrorText(error),
            })
        }
    }
}

module.exports = new TariffsController()
