import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/material-claim'

export default class MaterialClaimApi {
    async get(tokens) {
        const params = new URLSearchParams()
        tokens.forEach(token => params.append('token[]', token))
        const url = `${mainUrl}?${params.toString()}`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async post(tokens, walletSignature) {
        return await api
            .post(mainUrl, {tokens, walletSignature})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }
}
