const tokenService = require('../services/sevensTokenService')
const { success, badRequest, badResponse, checkIsNotEmpty, checkIsWalletAddress } = require('../utils/controller')

class SevensTokenController {
    constructor() {
        this.getTokens = this.getTokens.bind(this)
        this.getByPublicKey = this.getByPublicKey.bind(this)
        this.getByHash = this.getByHash.bind(this)
        this.getAgeMinutes = this.getAgeMinutes.bind(this)
        this.getBuyTransaction = this.getBuyTransaction.bind(this)
        this.getBurnTransaction = this.getBurnTransaction.bind(this)
    }

    async getTokens(req, res) {
        try {
            const { publicKey, hash } = req.query

            if (publicKey) {
                return await this.getByPublicKey(publicKey, res)
            }

            if (hash) {
                return await this.getByHash(hash, res)
            }

            badRequest(res, 'Either publicKey or hash query parameter is required')
        } catch (error) {
            badResponse('Get token', res, req, error)
        }
    }

    async getByPublicKey(publicKey, res) {
        try {
            checkIsNotEmpty(publicKey, 'publicKey')
            checkIsWalletAddress(publicKey, 'publicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await tokenService.getTokenByPublicKey(publicKey))
        } catch (error) {
            badResponse('Get token by public key', res, {req: {query: {publicKey}}}, error)
        }
    }

    async getByHash(hash, res) {
        try {
            checkIsNotEmpty(hash, 'hash')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await tokenService.getTokenByHash(hash))
        } catch (error) {
            badResponse('Get token by hash', res, {req: {query: {hash}}}, error)
        }
    }

    async getAgeMinutes(req, res) {
        const { publicKey } = req.query

        try {
            checkIsNotEmpty(publicKey, 'publicKey')
            checkIsWalletAddress(publicKey, 'publicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await tokenService.getAgeMinutes(publicKey))
        } catch (error) {
            badResponse('Get token age', res, req, error)
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
            success(res, await tokenService.getBuyTransaction(tokenPublicKey, buyerPublicKey))
        } catch (error) {
            badResponse('Get buy transaction', res, req, error)
        }
    }

    async getBurnTransaction(req, res) {
        const { tokenPublicKey } = req.query

        try {
            checkIsNotEmpty(tokenPublicKey, 'tokenPublicKey')
            checkIsWalletAddress(tokenPublicKey, 'tokenPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await tokenService.getBurnTransaction(tokenPublicKey))
        } catch (error) {
            badResponse('Get burn transaction', res, req, error)
        }
    }
}

module.exports = new SevensTokenController()
