import { getTokenByHash } from '@js/blockchain/sevens-token'

export const deriveTokenData = async (hash, setTokenData) => getTokenByHash(hash)
    .then(setTokenData)
    .catch(() => setTokenData({error: 'Token not found'}))
