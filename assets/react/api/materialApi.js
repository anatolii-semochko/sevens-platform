import api, { throwErrorMessage } from '@react/api/indexApi'

const mainUrl = '/material'

export const createMaterial = async (containerFileName, containerHash, tokenPublicKey, walletSignature) => api
    .post(mainUrl + '/create', {containerFileName, containerHash, tokenPublicKey, walletSignature})
    .then(response => response.data)
    .catch(throwErrorMessage)
