import * as anchor from '@coral-xyz/anchor'
import { PublicKey, Keypair, Connection } from '@solana/web3.js'
import {
    getAssociatedTokenAddressSync,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { execSync } from 'child_process'
import fs from 'fs'

const commitment = 'confirmed'
const connection = new Connection(process.env.ANCHOR_PROVIDER_URL, commitment)

const secretKey = () => Uint8Array.from(JSON.parse(fs.readFileSync(getSolanaKeypairPath(), 'utf-8')))
const walletKeypair = () => Keypair.fromSecretKey(Uint8Array.from(secretKey()))
const wallet = () => new anchor.Wallet(walletKeypair())

const provider = () => new anchor.AnchorProvider(connection, wallet(), { commitment, preflightCommitment: commitment })

const getPda = (programId, pdaName, publicKey) => PublicKey.findProgramAddressSync(
    [Buffer.from(pdaName), publicKey.toBuffer()],
    programId,
)[0]

const getWalletTokens = async (walletPubicKey) => {
    try {
        const publicKey = walletPubicKey ? new PublicKey(walletPubicKey) : provider().wallet.publicKey
        const tokenAccounts = await provider().connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
        })

        const tokens = []
        for (const accountInfo of tokenAccounts.value) {
            const accountData = accountInfo.account.data.parsed.info
            const amount = parseInt(accountData.tokenAmount.amount)
            const decimals = parseInt(accountData.tokenAmount.decimals)
            if (amount === 1 && decimals === 0) {
                tokens.push(await getTokenData(accountData.mint))
            }
        }

        return tokens
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const tokenTransfer = async ({tokenPublicKey, targetAddressPublicKey}) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const from = provider().wallet.publicKey
        const to = new PublicKey(targetAddressPublicKey)
        const sourceTokenAccount = getAssociatedTokenAddressSync(mint, from)
        const destinationTokenAccount = getAssociatedTokenAddressSync(mint, to)
        const tx = new anchor.web3.Transaction()
        const destinationInfo = await provider().connection.getAccountInfo(destinationTokenAccount)
        if (!destinationInfo) {
            tx.add(
                createAssociatedTokenAccountInstruction(
                    from,
                    destinationTokenAccount,
                    to,
                    mint,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            )
        }
        tx.add(
            createTransferInstruction(
                sourceTokenAccount,
                destinationTokenAccount,
                from,
                1, // transfer 1 token
                [],
                TOKEN_PROGRAM_ID
            )
        )
        const txSig = await provider().sendAndConfirm(tx)

        return {
            tx: txSig,
            from: from.toBase58(),
            to: to.toBase58(),
            token: mint.toBase58(),
        }
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const getSlot = async () => provider().connection.getSlot()

function getSolanaKeypairPath() {
    const configOutput = execSync('solana config get', { encoding: 'utf-8' })
    const match = configOutput.match(/Keypair Path: (.+)/)
    if (!match) {
        throw new Error('No keypair path found in Solana configuration.')
    }
    return match[1].trim()
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

export { provider, commitment, getPda, getSlot, getWalletTokens, tokenTransfer, getAnchorErrorText }
