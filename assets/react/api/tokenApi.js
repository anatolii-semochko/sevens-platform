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
}
