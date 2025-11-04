import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/token'

export default class TokenApi {
    async getTokenData(token){
        const url = `${mainUrl}/${token}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async getTokenDataByHash(hash){
        const url = `${mainUrl}/get-buy-hash/${hash}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async fetchTokensByWallet(walletPublicKey){
        const url = `${mainUrl}/fetch-buy-wallet/${walletPublicKey}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async getMintTransaction(mintPublicKey, params) {
        const url = `${mainUrl}/${mintPublicKey}/mint`
        return await api
            .get(url, { params })
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async postMintTransaction(mintPublicKey, transactionId, txSignature) {
        const url = `${mainUrl}/${mintPublicKey}/mint`
        return await api
            .post(url, {transactionId, txSignature})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async getSaleTransaction(token, price) {
        const url = `${mainUrl}/${token}/sale/${price}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async postSaleTransaction(token, transactionId, txSignature) {
        const url = `${mainUrl}/${token}/sale`
        return await api
            .post(url, {transactionId, txSignature})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async getBuyTransaction(token, buyerPublicKey) {
        const url = `${mainUrl}/${token}/buy/${buyerPublicKey}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async postBuyTransaction(token, deactivate, transactionId, txSignature) {
        const url = `${mainUrl}/${token}/buy`
        return await api
            .post(url, {deactivate, transactionId, txSignature})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async getBurnTransaction(token) {
        const url = `${mainUrl}/${token}/burn`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async postBurnTransaction(token, transactionId, txSignature) {
        const url = `${mainUrl}/${token}/burn`
        return await api
            .post(url, {transactionId, txSignature})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }
}
