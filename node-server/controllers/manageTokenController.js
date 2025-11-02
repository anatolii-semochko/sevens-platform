const manageTokenService = require('../services/manageTokenService')
const {
    success,
    badRequest,
    badResponse,
    checkIsNotEmpty,
    checkIsWalletAddress,
    checkIsNotNegative
} = require('../utils/controller')

class ManageTokenController {
    async getData(req, res) {
        const { tokenPublicKey } = req.query

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.getValidatedTokenData(tokenPublicKey))
        } catch (error) {
            badResponse('Get validated token data', res, req, 500)
        }
    }

    async matchData(req, res) {
        const { tokenPublicKey } = req.query

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.matchTokenData(tokenPublicKey))
        } catch (error) {
            badResponse('Math token data with management', res, req, error)
        }
    }

    async getPrice(req, res) {
        const { tokenPublicKey } = req.query

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.getPriceWithFee(tokenPublicKey))
        } catch (error) {
            badResponse('Get token price', res, req, error)
        }
    }

    async getMintTransaction(req, res) {
        const { walletPublicKey, mintPublicKey, tokenName, author, hash, description, canBeBurned } = req.query

        try {
            checkIsNotEmpty(walletPublicKey, 'walletPublicKey')
            checkIsWalletAddress(walletPublicKey, 'walletPublicKey')
            checkIsNotEmpty(mintPublicKey, 'mintPublicKey')
            checkIsWalletAddress(mintPublicKey, 'mintPublicKey')
            checkIsNotEmpty(tokenName, 'tokenName')
            checkIsNotEmpty(hash, 'hash')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.getMintTransaction(walletPublicKey, mintPublicKey, {
                tokenName,
                hash,
                author: author || '',
                description: description || '',
                canBeBurned: canBeBurned === 'true' || canBeBurned === '1' || canBeBurned === true,
            }))
        } catch (error) {
            badResponse('Get mint transaction', res, req, error)
        }
    }

    async getSaleTransaction(req, res) {
        const { tokenPublicKey, price } = req.query

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
            checkIsNotNegative(price, 'price')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.getSetSaleTransaction(tokenPublicKey, parseFloat(price)))
        } catch (error) {
            badResponse('Get sale transaction', res, req, error)
        }
    }

    async getBuyTransaction(req, res) {
        const { tokenPublicKey, buyerPublicKey } = req.query

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
            checkIsNotEmpty(buyerPublicKey, 'buyerPublicKey')
            checkIsWalletAddress(buyerPublicKey, 'buyerPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.getBuyTransaction(tokenPublicKey, buyerPublicKey))
        } catch (error) {
            badResponse('Get buy transaction', res, req, error)
        }
    }

    async getBurnTransaction(req, res) {
        const { tokenPublicKey } = req.body

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await manageTokenService.getBurnTransaction(tokenPublicKey))
        } catch (error) {
            badResponse('Get burn transaction', res, req, error)
        }
    }
}

module.exports = new ManageTokenController()
