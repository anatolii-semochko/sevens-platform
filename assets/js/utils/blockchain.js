import { Transaction } from '@solana/web3.js'

export let hdtIdl
fetch(process.env.HDT_IDL_PATH)
    .then(response => response.json())
    .then(idl => hdtIdl = idl)
    .catch(error => console.error(error))

export const getDeserializedTransaction = (transactionString) => Transaction.from(Buffer.from(
    transactionString,
    'base64',
))

export const getSerializedTransaction = (transactionBuffer) => transactionBuffer.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
}).toString('base64')

export const getAnchorErrorText = (error) => {
    const originalMessage = error?.message || 'Unknown error'

    // Define user-friendly error patterns and their messages
    const errorPatterns = [
        // Wallet/Account issues
        {
            pattern: /Attempt to debit an account but found no record of a prior credit/,
            message: 'Insufficient wallet balance. Please add SOL to your wallet to cover transaction fees.'
        },
        {
            pattern: /Account does not have enough SOL to perform the operation/,
            message: 'Insufficient SOL balance. Please add more SOL to your wallet.'
        },
        {
            pattern: /Account not found/,
            message: 'Wallet account not found. Please ensure your wallet is properly connected.'
        },
        {
            pattern: /Invalid public key/,
            message: 'Invalid wallet address. Please check your wallet connection.'
        },

        // Transaction issues
        {
            pattern: /Transaction was not confirmed/,
            message: 'Transaction failed to confirm. Please try again.'
        },
        {
            pattern: /Blockhash not found/,
            message: 'Transaction expired. Please try again.'
        },

        // Program-specific errors (extracted from logs or error codes)
        {
            pattern: /Error Message: (.+?)\.?$/,
            message: (match) => match[1] // Use the exact error message from smart contract
        },
        {
            pattern: /TokenNameEmpty|Token name cannot be empty/,
            message: 'Token name cannot be empty'
        },
        {
            pattern: /Error Code: (\w+)/,
            message: (match) => {
                const errorCodeMap = {
                    'TokenNameEmpty': 'Token name cannot be empty',
                    'InvalidTokenParameters': 'Invalid token parameters',
                    'InsufficientFunds': 'Insufficient funds',
                    'Unauthorized': 'You are not authorized to perform this action',
                    'AccountNotFound': 'Required account not found'
                }
                return errorCodeMap[match[1]] || `Program error: ${match[1]}`
            }
        },

        // Numeric error codes
        {
            pattern: /(Custom:|Error Number:|0x[0-9a-fA-F]+)\s*(\d+|[0-9a-fA-F]+)/,
            message: (match) => {
                let errorCode = match[2]

                // Convert hex to decimal if needed
                if (match[1].includes('0x')) {
                    errorCode = parseInt(errorCode, 16).toString()
                }

                const errorCodeMap = {
                    '6012': 'Token name cannot be empty',
                    '6013': 'Invalid token parameters',
                    '6014': 'Insufficient funds',
                    '6015': 'You are not authorized to perform this action',
                    '6016': 'Required account not found'
                }

                return errorCodeMap[errorCode] || `Program error ${errorCode}`
            }
        }
    ]

    // Extract error message from logs if available
    const extractFromLogs = (logs) => {
        if (!logs || !Array.isArray(logs)) {
            console.log('extractFromLogs: no logs available')
            return null
        }

        console.log('extractFromLogs: processing logs:', logs)

        for (const log of logs) {
            console.log('checking log:', log)

            // Check each error pattern against the log
            for (const { pattern, message } of errorPatterns) {
                const match = log.match(pattern)
                if (match) {
                    const result = typeof message === 'function' ? message(match) : message
                    console.log('extractFromLogs: found match:', { pattern, match, result })
                    return result
                }
            }
        }
        console.log('extractFromLogs: no patterns matched')
        return null
    }

    // Try to extract from logs first (most specific)
    if (error.logs) {
        const logMessage = extractFromLogs(error.logs)
        if (logMessage) return logMessage
    }

    // Handle structured Anchor errors
    if (error?.error?.errorMessage) {
        return error.error.errorMessage
    }

    // Check original message against patterns
    for (const { pattern, message } of errorPatterns) {
        const match = originalMessage.match(pattern)
        if (match) {
            return typeof message === 'function' ? message(match) : message
        }
    }

    // Fallback: clean up technical jargon from original message
    let cleanMessage = originalMessage
        .replace(/Transaction simulation failed:\s*/i, '')
        .replace(/Simulation failed\.\s*Message:\s*/i, '')
        .replace(/Error processing Instruction \d+:\s*/i, '')
        .replace(/custom program error:\s*0x[0-9a-fA-F]+/i, '')
        .replace(/Catch the `SendTransactionError`.*$/i, '')
        .trim()

    // If we still have a very technical message, provide a generic user-friendly one
    if (cleanMessage.length > 200 || cleanMessage.includes('Program ') || cleanMessage.includes('0x')) {
        return 'Transaction failed. Please check your inputs and try again.'
    }

    return cleanMessage || 'Transaction failed. Please try again.'
}
