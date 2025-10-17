import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/auth'

export default class AuthApi {
    async login(email, password) {
        const url = `${mainUrl}/login`
        return api
            .post(url, { email, password })
            .then(response => response.data)
            .catch(throwErrorMessage)
    }
}
