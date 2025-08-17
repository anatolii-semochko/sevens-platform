import CryptoJS from 'crypto-js'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import nacl from 'tweetnacl'
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createBurnInstruction,
} from '@solana/spl-token'
/// TODO - MOVE HERE
import { getWalletTokens, getAnchorErrorText } from '@js/blockchain/sevens'
import { getData } from '@js/blockchain/sevens-token'
/// TODO - MOVE HERE
import { EncryptedAddress, Password, Wallet, WalletToken } from '@react/components/wallet/scripts/Types'
import { readStored, writeStored, readEncryptedWallets, writeEncryptedWallets } from '@react/components/wallet/scripts/storageActions'

export const connection = new Connection(process.env.ANCHOR_PROVIDER_URL ?? '', 'confirmed')


export const reloadAllWallets = async (password: string): Promise<EncryptedAddress[]> => {
    const base = await readEncryptedWallets(password)

    const updated = await Promise.all(
        base.map(async (w: EncryptedAddress) => {
            try {
                const publicKey = new PublicKey(w.publicKey).toBase58()
                const balance = await getBalance(publicKey)
                const tokens = await fetchWalletTokensWithData(publicKey)
                return { ...w, balance, tokens }
            } catch (err) {
                console.error('Failed to reload wallet', w.publicKey, err)
                return { ...w, balance: 0, tokens: [] }
            }
        })
    )

    await writeEncryptedWallets(updated, password)
    return updated
}

export const getBalance = async (pubKeyString: string | PublicKey): Promise<number> => {
    const pubkey = typeof pubKeyString === 'string' ? new PublicKey(pubKeyString) : pubKeyString
    return connection.getBalance(pubkey)
}

export const fetchWalletTokensWithData = async (pubKeyStr: string): Promise<WalletToken[]> => {
    const tokens = await getWalletTokens(pubKeyStr)
    for (const t of tokens) {
        t.data = (await getData(t.mint)) ?? {}
    }
    return tokens
}


export const addWalletByKey = async (
    walletName: string,
    kp: Keypair,
    password: Password,
    mnemonic?: string
): Promise<EncryptedAddress> => {
    const newAddr: EncryptedAddress = {
        name: walletName,
        publicKey: kp.publicKey.toBase58(),
        secret: CryptoJS.AES.encrypt(
            JSON.stringify(Array.from(kp.secretKey)),
            password
        ).toString(),
        mnemonicEnc: mnemonic
            ? CryptoJS.AES.encrypt(mnemonic, password).toString()
            : '',
    }

    const passwordString = typeof password === 'string' ? password : password.toString()
    const existing = await readEncryptedWallets(passwordString)
    const arr = [...existing, newAddr]
    await writeEncryptedWallets(arr, passwordString)
    return newAddr
}

export const checkWalletByKey = async (
    key: Keypair | PublicKey | string
): Promise<{ found: boolean; balance: | null | number; tokens: number; }> => {
    try {
        const pubkey = key instanceof Keypair
            ? key.publicKey
            : (typeof key === 'string' ? new PublicKey(key) : key)

        const [info, balance, tokens] = await Promise.all([
            connection.getAccountInfo(pubkey),
            connection.getBalance(pubkey),
            getWalletTokens(pubkey),
        ])

        return {
            found: !!info,
            balance,
            tokens: tokens?.length || 0,
        }
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const removeWallet = async (publicKey: string, password: string): Promise<void> => {
    const currentWalletsList = await readEncryptedWallets(password)
    const newWalletsList = currentWalletsList.filter(
        (wallet: EncryptedAddress) => wallet.publicKey !== publicKey
    )
    await writeEncryptedWallets(newWalletsList, password)
}

export const renameWallet = async (
    publicKey: string,
    walletName: string,
    password: string
): Promise<void> => {
    const walletsList = await readEncryptedWallets(password)
    walletsList.map((wallet: EncryptedAddress) => {
        if (wallet.publicKey === publicKey) {
            wallet.name = walletName
        }
    })
    await writeEncryptedWallets(walletsList, password)
}

export const getKeypair = (
    walletData: EncryptedAddress,
    password: Password,
): Keypair | null => {
    if (!walletData?.secret || !password) {
        console.warn('Missing address or password')
        return null
    }

    try {
        const decryptedBytes = CryptoJS.AES.decrypt(walletData.secret, password)
        const decryptedUtf8 = decryptedBytes.toString(CryptoJS.enc.Utf8)
        if (!decryptedUtf8) {
            console.warn('Empty or invalid decrypted data')
            return null
        }

        const secretArray = JSON.parse(decryptedUtf8)
        return Keypair.fromSecretKey(Uint8Array.from(secretArray))
    } catch (err) {
        console.error('Decryption failed', err)
        return null
    }
}

export const getWalletFromKeypair = (kp: Keypair): Wallet => {
    let connected = true
    let connecting = false

    return {
        publicKey: kp.publicKey,
        connected,
        connecting,
        connect: async () => ({ publicKey: kp.publicKey }),
        disconnect: async () => {
            connected = false
        },
        signTransaction: async (tx: Transaction) => {
            tx.sign(kp)
            return tx
        },
        signAllTransactions: async (txs: Transaction[]) => {
            txs.forEach((tx) => tx.sign(kp))
            return txs
        },
        signMessage: async (message: Uint8Array | string) => {
            const msg =
                typeof message === 'string'
                    ? new TextEncoder().encode(message)
                    : message
            return nacl.sign.detached(msg, kp.secretKey)
        },
    }
}

export const getWallet = (
    walletData: EncryptedAddress,
    password: Password,
): Wallet | null => {
    const kp = getKeypair(walletData, password)
    if (!kp) {
        throw new Error('Invalid wallet')
    }

    return getWalletFromKeypair(kp)
}

export const getProvider = (
    walletData: EncryptedAddress,
    password: Password,
): anchor.AnchorProvider | null => {
    const wallet = getWallet(walletData, password)
    if (!wallet) return null

    return new anchor.AnchorProvider(
        connection,
        wallet as unknown as anchor.Wallet,
        { commitment: 'confirmed' },
    )
}

export const sendCoins = async (
    toPublicKey: string,
    amount: number,
    wallet: Wallet,
): Promise<string | void> => {
    try {
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(toPublicKey),
                lamports: Math.round(Number(amount)),
            })
        )

        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        await wallet.signTransaction(tx)
        const sig = await connection.sendRawTransaction(tx.serialize())
        await connection.confirmTransaction(sig)

        return sig
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const getEstimateCoinsTransferFee = async (
    toPublicKey: string,
    amount: number,
    wallet: Wallet,
): Promise<number> => {
    try {
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(toPublicKey),
                lamports: Math.round(Number(amount)),
            })
        )

        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        const message = tx.compileMessage()
        const {value: feeLamports} = await connection.getFeeForMessage(message)

        if (!feeLamports) {
            new Error('Error occurred')
        }

        return feeLamports || 0
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const transferToken = async (
    tokenPublicKey: string,
    toPublicKey: string,
    wallet: Wallet,
    amount: number | bigint = 1,
): Promise<string | void> => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const fromOwner = wallet.publicKey
        const toOwner = new PublicKey(toPublicKey)

        const fromTokenAccount = await getAssociatedTokenAddress(mint, fromOwner)
        const toTokenAccount = await getAssociatedTokenAddress(mint, toOwner)

        const ixs: any[] = []
        const toAccInfo = await connection.getAccountInfo(toTokenAccount)
        if (!toAccInfo) {
            ixs.push(createAssociatedTokenAccountInstruction(fromOwner, toTokenAccount, toOwner, mint))
        }

        ixs.push(
            createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromOwner,
                typeof amount === 'number' ? Math.trunc(amount) : amount,
            ),
        )

        const tx = new Transaction().add(...ixs)
        tx.feePayer = fromOwner
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        await wallet.signTransaction(tx)
        const sig = await connection.sendRawTransaction(tx.serialize())
        await connection.confirmTransaction(sig)

        return sig
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const burnToken = async (
    tokenPublicKey: string,
    wallet: Wallet,
    amount: number | bigint = 1,
): Promise<string | void> => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const owner = wallet.publicKey

        const tokenAccount = await getAssociatedTokenAddress(mint, owner)
        const burnIx = createBurnInstruction(
            tokenAccount,
            mint,
            owner,
            typeof amount === 'number' ? Math.trunc(amount) : amount,
        )

        const tx = new Transaction().add(burnIx)
        tx.feePayer = owner
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        await wallet.signTransaction(tx)
        const sig = await connection.sendRawTransaction(tx.serialize())
        await connection.confirmTransaction(sig)

        return sig
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}
