import axios from 'axios'
import { route } from '@js/router/routing-with-locale'
import { throwErrorMessage } from '@react/api/indexApi'

export default class AuthApi {
    async login(email, password) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

        const formData = new URLSearchParams()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('_csrf_token', csrfToken)

        return axios
            .post(route('app_login'), formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                maxRedirects: 0,
                validateStatus: (status) => status < 400
            })
            .then(response => {
                // Symfony redirects on successful login
                if (response.status >= 300 && response.status < 400) {
                    return { success: true }
                }
                // If we get here without redirect, login failed
                throw new Error('Invalid email or password')
            })
            .catch(error => {
                // Axios treats 3xx as errors by default, but that's success for us
                if (error.response?.status >= 300 && error.response?.status < 400) {
                    return { success: true }
                }
                // Login failed
                throwErrorMessage({ message: 'Invalid email or password' })
            })
    }
}
