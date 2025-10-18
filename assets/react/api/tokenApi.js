import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/token'

export default class TokenApi {
    async getSaleStatus(token) {
        const url = `${mainUrl}/${token}/sale-status`
        return await api
            .get(url)
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
}
