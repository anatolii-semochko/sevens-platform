const manageTokenService = require('../services/manageTokenService')
const tariffsService = require('../services/TariffsService')
const sevensTokenService = require('../services/sevensTokenService')

class ManageTokenController {
    /**
     * GET /node/manage/tariffs
     * Returns current tariffs
     */
    async getTariffs(req, res) {
        try {
            const tariffs = await tariffsService.getTariffs()
            res.json(tariffs)
        } catch (error) {
            console.error('Error getting tariffs:', error)
            res.status(500).json({
                error: 'Failed to get tariffs',
                message: error.message,
            })
        }
    }

    /**
     * GET /node/manage/transaction
     * Returns unsigned transaction for managed operation (mint/setSale/buy/burn)
     * Query params depend on operation type
     */
    async getTransaction(req, res) {
        try {
            const { operation } = req.query

            if (!operation) {
                return res.status(400).json({
                    error: 'Missing operation parameter',
                    message: 'operation is required (mint, setSale, buy, burn)',
                })
            }

            let transaction

            switch (operation) {
                case 'mint':
                    transaction = await manageTokenService.getMintTransaction(
                        req.query.payerPublicKey,
                        req.query.tokenPublicKey
                    )
                    break

                case 'setSale':
                    transaction = await manageTokenService.getSetSaleTransaction(
                        req.query.tokenPublicKey,
                        req.query.ownerPublicKey,
                        req.query.onSale === 'true',
                        req.query.price
                    )
                    break

                case 'buy':
                    transaction = await manageTokenService.getBuyTransaction(
                        req.query.tokenPublicKey,
                        req.query.buyerPublicKey
                    )
                    break

                case 'burn':
                    transaction = await manageTokenService.getBurnTransaction(
                        req.query.tokenPublicKey,
                        req.query.ownerPublicKey
                    )
                    break

                default:
                    return res.status(400).json({
                        error: 'Invalid operation',
                        message: 'operation must be one of: mint, setSale, buy, burn',
                    })
            }

            res.json([

            ])
        } catch (error) {
            console.error('Error getting transaction:', error)
            res.status(500).json({
                error: 'Failed to get transaction',
                message: error.message,
            })
        }
    }

    /**
     * POST /node/manage/mint
     * Executes managed mint operation with signed transaction
     */
    async mint(req, res) {
        try {
            const { signedTransaction } = req.body

            if (!signedTransaction) {
                return res.status(400).json({
                    error: 'Missing signedTransaction',
                })
            }

            const result = await manageTokenService.executeMint(signedTransaction)
            res.json(result)
        } catch (error) {
            console.error('Error executing mint:', error)
            res.status(500).json({
                error: 'Failed to execute mint',
                message: error.message,
            })
        }
    }

    /**
     * POST /node/manage/setSale
     * Executes managed setSale operation with signed transaction
     */
    async setSale(req, res) {
        try {
            const { signedTransaction } = req.body

            if (!signedTransaction) {
                return res.status(400).json({
                    error: 'Missing signedTransaction',
                })
            }

            res.json({
                success: true,
                data: await manageTokenService.executeSetSale(signedTransaction),
            })
        } catch (error) {
            console.error('Error executing setSale:', error)
            res.status(500).json({
                error: 'Failed to execute setSale',
                message: error.message,
            })
        }
    }

    /**
     * POST /node/manage/buy
     * Executes managed buy operation with signed transaction
     */
    async buy(req, res) {
        try {
            const { signedTransaction } = req.body

            if (!signedTransaction) {
                return res.status(400).json({
                    error: 'Missing signedTransaction',
                })
            }

            res.json({
                success: true,
                data: await manageTokenService.executeBuy(signedTransaction)
            })
        } catch (error) {
            console.error('Error executing buy:', error)
            res.status(500).json({
                error: 'Failed to execute buy',
                message: error.message,
            })
        }
    }

    /**
     * POST /node/manage/burn
     * Executes managed burn operation with signed transaction
     */
    async burn(req, res) {
        try {
            const { signedTransaction } = req.body

            if (!signedTransaction) {
                return res.status(400).json({
                    error: 'Missing signedTransaction',
                })
            }

            const result = await manageTokenService.executeBurn(signedTransaction)
            res.json(result)
        } catch (error) {
            console.error('Error executing burn:', error)
            res.status(500).json({
                error: 'Failed to execute burn',
                message: error.message,
            })
        }
    }

    /**
     * GET /node/manage/get-data?tokenPublicKey=xxx
     * Returns TokenManagementData PDA for the token
     */
    async getData(req, res) {
        try {
            const { tokenPublicKey } = req.query

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            const data = await manageTokenService.getTokenManagementData(tokenPublicKey)
            res.json(data)
        } catch (error) {
            console.error('Error getting token management data:', error)
            res.status(500).json({
                error: 'Failed to get token management data',
                message: error.message,
            })
        }
    }

    /**
     * GET /node/manage/match-data?tokenPublicKey=xxx
     * Compares actual token state with TokenManagementData
     * Returns true if matches, or array of mismatches
     */
    async matchData(req, res) {
        try {
            const { tokenPublicKey } = req.query

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            const result = await manageTokenService.matchTokenData(tokenPublicKey)
            res.json(result)
        } catch (error) {
            console.error('Error matching token data:', error)
            res.status(500).json({
                error: 'Failed to match token data',
                message: error.message,
            })
        }
    }

    /**
     * GET /node/manage/price?tokenPublicKey=xxx
     * Returns token price with buy fee included
     * Returns null if token is not on sale
     */
    async getPrice(req, res) {
        try {
            const { tokenPublicKey } = req.query

            if (!tokenPublicKey) {
                return res.status(400).json({
                    error: 'Missing tokenPublicKey parameter',
                })
            }

            const price = await manageTokenService.getPriceWithFee(tokenPublicKey)
            res.json({ price })
        } catch (error) {
            console.error('Error getting price:', error)
            res.status(500).json({
                error: 'Failed to get price',
                message: error.message,
            })
        }
    }

    /**
     * GET /node/manage/sale?tokenPublicKey=xxx&price=xxx
     * Returns unsigned setSale transaction
     * If price is 0, removes from sale. If > 0, sets on sale.
     * Automatically determines owner by querying token account.
     */
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

    /**
     * GET /node/manage/buy?tokenPublicKey=xxx&buyerPublicKey=xxx
     * Returns unsigned buy transaction
     * Buyer must provide their public key as parameter
     */
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
}

module.exports = new ManageTokenController()
