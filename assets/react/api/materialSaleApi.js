import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/material-sale'

export default class MaterialSaleApi {
    async getHistory(token) {
        const url = `${mainUrl}/${token}/history`
        return await api
            .get(url)
            .then(response => response.data)
            .catch(throwErrorMessage)
    }

    async refresh(token) {
        const url = `${mainUrl}/${token}/refresh`
        return api
            .post(url, {})
            .then(response => response.data)
            .catch(throwErrorMessage)
    }
}
