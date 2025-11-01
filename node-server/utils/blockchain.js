const { PublicKey, Connection } = require('@solana/web3.js')
const anchor = require('@coral-xyz/anchor')
const https = require('https')
const fs = require('fs').promises
const { URL } = require('url')

const commitment = 'confirmed'

/**
 * Universal IDL loader that supports multiple sources
 *
 * Loads and validates Anchor IDL files from:
 * - Local file system (absolute paths starting with '/')
 * - HTTPS URLs (with self-signed certificate support in development)
 * - HTTP URLs (using fetch API) *
 * @returns {Promise<Object>} Parsed and validated IDL object with metadata.address
 * @throws {Error} If IDL file cannot be read, parsed, or is missing required fields
 */
const loadedIds = []
const loadIdl = async (idlName) => {
    if (loadedIds[idlName]) {
        return loadedIds[idlName]
    }

    const idlPath = process.env[idlName]
    if (!idlPath) {
        throw new Error(`${idlName} not set in environment`)
    }

    try {
        let idl

        // Local file path
        if (idlPath.startsWith('/')) {
            const data = await fs.readFile(idlPath, 'utf8')
            idl = JSON.parse(data)
        }
        // HTTPS URL - development mode with self-signed certificates
        else if (process.env.NODE_ENV === 'development' && idlPath.startsWith('https:')) {
            const url = new URL(idlPath)
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: 'GET',
                rejectUnauthorized: false, // Ignore self-signed certificates in development
            }

            const data = await new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let body = ''
                    res.on('data', chunk => body += chunk)
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            resolve(body)
                        } else {
                            reject(new Error(`Failed to fetch IDL (${idlName}): HTTP ${res.statusCode}`))
                        }
                    })
                })
                req.on('error', reject)
                req.end()
            })

            idl = JSON.parse(data)
        }
        // Production URL or HTTP - use fetch
        else {
            const response = await fetch(idlPath)
            if (!response.ok) {
                throw new Error(`Failed to fetch IDL (${idlName}): ${response.statusText}`)
            }
            idl = await response.json()
        }

        // Validate IDL structure
        if (!idl?.metadata?.address) {
            throw new Error(`Invalid IDL structure - missing metadata.address (${idlName})`)
        }

        console.log(`✅ ${idlName} loaded successfully`)
        loadedIds[idlName] = idl

        return idl
    } catch (error) {
        throw new Error(`IDL loading error from ${idlPath}: ${error.message}`)
    }
}

const initializeProvider = (idl) => {
    const connection = new Connection(process.env.ANCHOR_PROVIDER_URL, commitment)
    const provider = new anchor.AnchorProvider(connection, getDummyWallet(), { commitment })
    return {
        connection,
        provider,
        program: idl ? new anchor.Program(idl, new PublicKey(idl.metadata.address), provider) : null,
    }
}

const getDummyWallet = () => ({
    publicKey: PublicKey.default,
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
})

const getPda = (programId, pdaName, publicKey) => {
    const seeds = [Buffer.from(pdaName)]
    if (publicKey) {
        seeds.push(publicKey.toBuffer())
    }
    return PublicKey.findProgramAddressSync(seeds, programId)[0]
}

const serializeTransaction = (transaction) => transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
}).toString('base64')

const deserializeTransaction = (transaction) => Buffer.from(transaction, 'base64')


// TODO - create one common file for all project
const getAnchorErrorText = (error) => {
    const originalMessage = error?.message || 'Unknown error'

    // Define user-friendly error patterns and their messages
    const errorPatterns = [
        // Wallet/Account issues
        {
            pattern: /Attempt to debit an account but found no record of a prior credit/,
            message: 'Insufficient wallet balance. Please add $SEV to your wallet to cover transaction fees.'
        },
        {
            pattern: /Account does not have enough SOL to perform the operation/,
            message: 'Insufficient $SEV balance. Please add more $SEV to your wallet.'
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
                    // sevens-token-management errors (6000-6011)
                    '6000': 'Unauthorized: only the authority can update tariffs',
                    '6001': 'Invalid buy percentage: must be between 0 and 99',
                    '6002': 'Invalid target wallet: cannot be the default address',
                    '6003': 'Operations are currently paused',
                    '6004': 'Not the token owner',
                    '6005': 'No tokens in account',
                    '6006': 'Invalid price: must be greater than 0 when setting on sale',
                    '6007': 'Token is not for sale',
                    '6008': 'Price mismatch: expected price doesn\'t match current price',
                    '6009': 'Invalid mint address',
                    '6010': 'Invalid seller address',
                    '6011': 'Math overflow occurred',
                    // sevens-token errors (6012+)
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
            return null
        }

        for (const log of logs) {

            // Check each error pattern against the log
            for (const { pattern, message } of errorPatterns) {
                const match = log.match(pattern)
                if (match) {
                    const result = typeof message === 'function' ? message(match) : message
                    return result
                }
            }
        }
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

module.exports = {
    commitment,
    loadIdl, initializeProvider,
    getPda,
    serializeTransaction, deserializeTransaction,
    getAnchorErrorText,
}
