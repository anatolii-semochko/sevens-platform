import axios from 'axios'

export const fetchNonce = async (walletPublicKey) => {
    const url = `/node/auth/nonce?walletAddress=${walletPublicKey}`
    return fetch(url)
        .then(response => response.json())
        .then(data => data.data)
        .catch(() => {})
}

export const validateNonce = async (walletAddress, signature, nonce) => {
    const url = '/node/auth/verify'
    return axios.post(url, {walletAddress, signature, nonce})
        .then(response => response.data.data)
        .catch(() => {})
}
