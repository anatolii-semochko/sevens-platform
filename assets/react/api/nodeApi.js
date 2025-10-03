import axios from 'axios'
import { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/node'

export const fetchNonce = async (walletPublicKey) => {
    const url = mainUrl + `/auth/nonce?walletAddress=${walletPublicKey}`
    return axios.get(url)
        .then(response => response.data.data)
        .catch(throwErrorMessage)
}

export const validateNonce = async (walletAddress, signature, nonce) => {
    const url = mainUrl + `/auth/verify`
    axios.post(url, {walletAddress, signature, nonce})
        .then(response => response.data.data)
        .catch(throwErrorMessage)
}
