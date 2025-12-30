const tokenService = require('../services/tokenService')
const {
    success,
    badRequest,
    badResponse,
    checkIsNotEmpty,
    checkIsWalletAddress,
} = require('../utils/controller')

class TokenController {
    constructor() {
        this.getTokens = this.getTokens.bind(this)
        this.getByPublicKey = this.getByPublicKey.bind(this)
        this.getByHash = this.getByHash.bind(this)
        this.getByWallet = this.getByWallet.bind(this)
        this.getAgeMinutes = this.getAgeMinutes.bind(this)
    }

    async getTokens(req, res) {
        try {
            const { publicKey, hash, walletPublicKey } = req.query

            if (publicKey) {
                return await this.getByPublicKey(publicKey, res)
            }

            if (hash) {
                return await this.getByHash(hash, res)
            }

            if (walletPublicKey) {
                return await this.getByWallet(walletPublicKey, res)
            }

            badRequest(res, 'The publicKey, hash, or walletPublicKey query parameter is required.')
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

    async getByWallet(walletPublicKey, res) {
        try {
            checkIsNotEmpty(walletPublicKey, 'walletPublicKey')
            checkIsWalletAddress(walletPublicKey, 'walletPublicKey')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await tokenService.getTokenByWallet(walletPublicKey))
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
}

module.exports = new TokenController()
