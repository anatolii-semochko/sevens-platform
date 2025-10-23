import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/material'

export default class MaterialApi {
    async get(token) {
        const url = `${mainUrl}/${token}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async create(container, tokenPublicKey, walletSignature) {
        const url = `${mainUrl}/create`
        return api
            .post(url, {container, tokenPublicKey, walletSignature})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async put(token, material) {
        const url = `${mainUrl}/${token}`
        return api
            .put(url, material)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async delete(token) {
        const url = `${mainUrl}/${token}`
        return api
            .delete(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }
}
