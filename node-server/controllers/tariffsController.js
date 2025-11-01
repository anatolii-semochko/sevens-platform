const tariffsService = require('../services/tariffsService')
const {
    success,
    badRequest,
    badResponse,
    checkIsNotEmpty,
    checkIsWalletAddress,
    checkIsNotNegative,
} = require('../utils/controller')

class TariffsController {
    async getTariffs(req, res) {
        try {
            success(res, await tariffsService.getTariffs())
        } catch (error) {
            badResponse('Get tariffs', res, req, error)
        }
    }

    async getTransaction(req, res) {
        const { authorityPublicKey, targetWallet, mint, setSale, buy, burn } = req.query

        try {
            checkIsNotEmpty(authorityPublicKey, 'authorityPublicKey')
            checkIsWalletAddress(authorityPublicKey, 'authorityPublicKey')
            checkIsNotEmpty(targetWallet, 'targetWallet')
            checkIsWalletAddress(targetWallet, 'targetWallet')
            checkIsNotNegative(mint, 'mint')
            checkIsNotNegative(setSale, 'setSale')
            checkIsNotNegative(buy, 'buy')
            checkIsNotNegative(burn, 'burn')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            success(res, await tariffsService.getSetTariffsTransaction(
                authorityPublicKey,
                targetWallet,
                parseInt(mint, 10),
                parseInt(setSale, 10),
                parseInt(buy, 10),
                parseInt(burn, 10)
            ))
        } catch (error) {
            badResponse('Get tariffs manage transaction', res, req, error)
        }
    }
}

module.exports = new TariffsController()
