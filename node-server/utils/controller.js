const { PublicKey } = require('@solana/web3.js')
const { getAnchorErrorText } = require('./blockchain')

const checkIsNotEmpty = (value, propertyName) => {
    if (!value) {
        throw new Error(`${propertyName || 'Value'} is empty`)
    }
}

const checkIsNotUndefined = (value, propertyName) => {
    if (value === undefined) {
        throw new Error(`${propertyName || 'Value'} is undefined`)
    }
}

const checkIsNumber = (value, propertyName) => {
    if (isNaN(value)) {
        throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} number format`)
    }
}

const checkIsNotNegative = (value, propertyName) => {
    checkIsNumber(value, propertyName)
    if (parseInt(value) < 0) {
        throw new Error(`${propertyName ? propertyName : 'Property'} is less then zero`)
    }
}

const checkIsAddress = (publicKey, propertyName) => {
    try {
        const pubKey = new PublicKey(publicKey)
        if (!PublicKey.isOnCurve(pubKey)) {
            throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} public key`)
        }
    } catch (error) {
        throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} public key format`)
    }
}

const checkIsPdaAddress = (publicKey, propertyName) => {
    try {
        const pubKey = new PublicKey(publicKey)
        if (PublicKey.isOnCurve(pubKey)) {
            throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} PDA address (should not be on curve)`)
        }
    } catch (error) {
        if (error.message.includes('should not be on curve')) {
            throw error
        }
        throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} PDA address format`)
    }
}

const checkIsWalletAddress = (publicKey, propertyName) => {
    try {
        const pubKey = new PublicKey(publicKey)
        if (!PublicKey.isOnCurve(pubKey)) {
            throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} wallet address`)
        }
    } catch (error) {
        if (error.message.includes('Invalid wallet address')) {
            throw error
        }
        throw new Error(`${propertyName ? propertyName + ' is invalid' : 'Invalid'} wallet address format`)
    }
}

const parseBoolean = (value) => value === 'true' || value === true || value === 1 || value === '1'

const success = (res, data = null) => res.status(200).json({
    success: true,
    data,
})

const badRequest = (res, error, errorCode = 400) => res.status(errorCode).json({
    error: 'Bad Request',
    message: error.message || error,
})

const badResponse = (action, res, req, error, errorCode = 404) => {
    console.error({
        action,
        params: !!Object.keys(req.query).length ? req.query : req.body,
        error,
    })
    res.status(errorCode).json({
        error: `${action} error`,
        message: getAnchorErrorText(error),
    })
}

module.exports = {
    success, badRequest, badResponse,
    checkIsNotEmpty,
    checkIsNotUndefined,
    checkIsNumber,
    checkIsNotNegative,
    checkIsAddress,
    checkIsPdaAddress,
    checkIsWalletAddress,
    parseBoolean,
}
