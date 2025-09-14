import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import {
    getAssociatedTokenAddressSync,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const commitment = 'confirmed'
const connection = new Connection(process.env.ANCHOR_PROVIDER_URL, commitment)

const getWalletTokens = async (walletPublicKey) => {
    try {
        const publicKey = new PublicKey(walletPublicKey)
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
        })

        const tokens = []
        for (const accountInfo of tokenAccounts.value) {
            const accountData = accountInfo.account.data.parsed.info
            const amount = parseInt(accountData.tokenAmount.amount, 10)
            const decimals = parseInt(accountData.tokenAmount.decimals, 10)
            if (amount === 1 && decimals === 0) {
                tokens.push({ mint: accountData.mint })
            }
        }

        return tokens
    } catch (error) {
        throw new Error(error?.message || 'Unknown error')
    }
}

const tokenTransfer = async ({ wallet, tokenPublicKey, targetAddressPublicKey }) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const from = wallet.publicKey
        const to = new PublicKey(targetAddressPublicKey)
        const sourceTokenAccount = getAssociatedTokenAddressSync(mint, from)
        const destinationTokenAccount = getAssociatedTokenAddressSync(mint, to)
        const tx = new Transaction()
        const destinationInfo = await connection.getAccountInfo(destinationTokenAccount)
        if (!destinationInfo) {
            tx.add(
                createAssociatedTokenAccountInstruction(
                    from,
                    destinationTokenAccount,
                    to,
                    mint,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                ),
            )
        }
        tx.add(
            createTransferInstruction(
                sourceTokenAccount,
                destinationTokenAccount,
                from,
                1,
                [],
                TOKEN_PROGRAM_ID,
            ),
        )
        tx.feePayer = from
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signed = await wallet.signTransaction(tx)
        const txSig = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(txSig)
        return { tx: txSig, from: from.toBase58(), to: to.toBase58(), token: mint.toBase58() }
    } catch (error) {
        throw new Error(error?.message || 'Unknown error')
    }
}

const getPda = (programId, pdaName, publicKey) => PublicKey.findProgramAddressSync(
    [Buffer.from(pdaName), publicKey.toBuffer()],
    programId,
)[0]

const isValidSolanaAddress = (input) => {
    if (typeof input !== 'string') return false
    const s = input.trim()
    if (s.length < 32 || s.length > 44) return false

    try {
        const pk = new PublicKey(s)
        return pk.toBase58() === s
    } catch {
        return false
    }
}

/** Valid Wallet Address (ed25519 public key на кривій). PDA — false */
const isValidWalletAddress = (input) => {
    try {
        const pk = new PublicKey(String(input).trim())
        return pk.toBase58() === String(input).trim() && PublicKey.isOnCurve(pk.toBytes())
    } catch {
        return false
    }
}

const getAnchorErrorText = (error) => {
    let message = error?.message || 'Unknown error' // Simple useful error
    if (error?.error?.errorMessage) { // If it is Anchor-program with structured error
        message = error.error.errorMessage
    }
    if (error?.error?.errorCode?.number) { // If it is Anchor error code
        message = `Anchor error ${error.error.errorCode.number}: ${message}`
    }

    return message
}

export {
    connection, commitment, getWalletTokens, tokenTransfer, getPda, getAnchorErrorText,
    isValidSolanaAddress, isValidWalletAddress,
}
