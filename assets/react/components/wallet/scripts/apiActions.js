import config from '@react/components/wallet/config.json'
import CryptoJS from 'crypto-js'
import { readEncryptedWallets, writeEncryptedWallets } from '@react/components/wallet/scripts/storageActions'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import nacl from 'tweetnacl'
import { t } from '@react/components/wallet/translations/translations'
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createBurnInstruction,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

let providerUrl = ''
export const setProviderUrl = (url) => providerUrl = url

export const connection = () => new Connection(providerUrl, 'confirmed')

let sevensIdl = {}
fetch(config.SEVENS_TOKEN_IDL_PATH)
    .then(response => response.json())
    .then(idl => sevensIdl = idl)
    .catch(error => console.error(error))

export const reloadAllWallets = async (password) => {
    const base = await readEncryptedWallets(password)

    return Promise.all(
        base.map(async (w) => {
            try {
                const publicKey = new PublicKey(w.publicKey).toBase58()
                const balance = await getBalance(publicKey)
                const tokens = await fetchWalletTokensWithData(publicKey)
                return { ...w, balance, tokens }
            } catch (error) {
                throw new Error(getAnchorErrorText(error))
            }
        })
    )
}

export const getBalance = async (pubKeyString) => {
    const pubkey = typeof pubKeyString === 'string' ? new PublicKey(pubKeyString) : pubKeyString
    return connection().getBalance(pubkey)
}

export const fetchWalletTokensWithData = async (pubKeyStr) => {
    const tokens = await getWalletTokens(pubKeyStr)
    for (const t of tokens) {
        t.data = (await getSevensTokenData(t.mint)) ?? {}
    }

    return tokens
}

export const addWalletByKey = async (walletName, kp, password, mnemonic) => {
    const newAddr = {
        name: walletName,
        publicKey: kp.publicKey.toBase58(),
        secret: CryptoJS.AES.encrypt(JSON.stringify(Array.from(kp.secretKey)), password).toString(),
        mnemonicEnc: mnemonic ? CryptoJS.AES.encrypt(mnemonic, password).toString() : '',
    }

    const passwordString = typeof password === 'string' ? password : password.toString()
    const existing = await readEncryptedWallets(passwordString)
    const arr = [...existing, newAddr]
    await writeEncryptedWallets(arr, passwordString)

    return newAddr
}

export const checkWalletByKey = async (key) => {
    try {
        const pubkey = key instanceof Keypair
            ? key.publicKey
            : (typeof key === 'string' ? new PublicKey(key) : key)

        const [info, balance, tokens] = await Promise.all([
            connection().getAccountInfo(pubkey),
            connection().getBalance(pubkey),
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

export const removeWallet = async (publicKey, password) => {
    const currentWalletsList = await readEncryptedWallets(password)
    const newWalletsList = currentWalletsList.filter((wallet) => wallet.publicKey !== publicKey)
    await writeEncryptedWallets(newWalletsList, password)
}

export const renameWallet = async (publicKey, walletName, password) => {
    const walletsList = await readEncryptedWallets(password)
    walletsList.map((wallet) => {
        if (wallet.publicKey === publicKey) {
            wallet.name = walletName
        }
    })
    await writeEncryptedWallets(walletsList, password)
}

export const getKeypair = (walletData, password) => {
    try {
        const decryptedBytes = CryptoJS.AES.decrypt(walletData.secret, password)
        const decryptedUtf8 = decryptedBytes.toString(CryptoJS.enc.Utf8)
        if (!decryptedUtf8) {
            new Error('Empty or invalid decrypted data')
        }

        const secretArray = JSON.parse(decryptedUtf8)

        return Keypair.fromSecretKey(Uint8Array.from(secretArray))
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const getWalletFromKeypair = (kp) => {
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
        signTransaction: async (tx) => {
            tx.sign(kp)
            return tx
        },
        signAllTransactions: async (txs) => {
            txs.forEach((tx) => tx.sign(kp))
            return txs
        },
        signMessage: async (message) => {
            const msg = typeof message === 'string' ? new TextEncoder().encode(message) : message
            return nacl.sign.detached(msg, kp.secretKey)
        },
    }
}

export const getWallet = (walletData, password) => {
    const kp = getKeypair(walletData, password)
    if (!kp) {
        throw new Error('Invalid wallet')
    }

    return getWalletFromKeypair(kp)
}

export const sendCoins = async (toPublicKey, amount, wallet) => {
    try {
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(toPublicKey),
                lamports: Math.round(Number(amount)),
            })
        )

        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection().getLatestBlockhash()).blockhash

        await wallet.signTransaction(tx)
        const sig = await connection().sendRawTransaction(tx.serialize())
        await connection().confirmTransaction(sig)

        return sig
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const getEstimateCoinsTransferFee = async (toPublicKey, amount, wallet) => {
    try {
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(toPublicKey),
                lamports: Math.round(Number(amount)),
            })
        )

        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection().getLatestBlockhash()).blockhash

        const message = tx.compileMessage()
        const {value: feeLamports} = await connection().getFeeForMessage(message)

        if (!feeLamports) {
            new Error('Error occurred')
        }

        return feeLamports || 0
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const getWalletTokens = async (walletPublicKey) => {
    try {
        const tokenAccounts = await connection().getParsedTokenAccountsByOwner(
            new PublicKey(walletPublicKey),
            {programId: TOKEN_PROGRAM_ID},
        )

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
        throw new Error(getAnchorErrorText(error))
    }
}

const getSevensToken = (publicKey) => {
    const program = new anchor.Program(
        sevensIdl,
        sevensIdl.metadata.address,
        new anchor.AnchorProvider(connection(), dummyWallet, { commitment: 'confirmed' })
    )
    return {
        sevensIdl,
        program,
        metadataPda: publicKey ? getPda(program.programId, 'metadata', publicKey) : null,
        salePda: publicKey ? getPda(program.programId, 'sale', publicKey) : null,
    }
}

const getSevensTokenData = async (tokenPublicKey) => {
    try {
        const publicKey = new PublicKey(tokenPublicKey)
        const {
            program,
            metadataPda,
            salePda,
        } = getSevensToken(publicKey)

        const metadata = await program.account.trustDataMetadata.fetch(metadataPda)
        const sale = await program.account.tokenSaleData.fetch(salePda)

        sale.priceLamports = sale.price.toNumber()
        sale.priceSevens = sale.price.toNumber() / LAMPORTS_PER_SOL

        return {
            tokenPublicKey,
            mintingTime: new Date(metadata.timestamp.toNumber() * 1000).toISOString(),
            metadata,
            sale,
        }
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const transferToken = async (tokenPublicKey, toPublicKey, wallet, amount = 1) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const fromOwner = wallet.publicKey
        const toOwner = new PublicKey(toPublicKey)

        const fromTokenAccount = await getAssociatedTokenAddress(mint, fromOwner)
        const toTokenAccount = await getAssociatedTokenAddress(mint, toOwner)

        const ixs = []
        const toAccInfo = await connection().getAccountInfo(toTokenAccount)
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
        tx.recentBlockhash = (await connection().getLatestBlockhash()).blockhash

        await wallet.signTransaction(tx)
        const sig = await connection().sendRawTransaction(tx.serialize())
        await connection().confirmTransaction(sig)

        return sig
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const burnToken = async (tokenPublicKey, wallet, amount = 1) => {
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
        tx.recentBlockhash = (await connection().getLatestBlockhash()).blockhash

        await wallet.signTransaction(tx)
        const sig = await connection().sendRawTransaction(tx.serialize())
        await connection().confirmTransaction(sig)

        return sig
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export const checkConnection = async () => {
    if (!providerUrl) return false

    try {
        const conn = connection()
        await conn.getLatestBlockhash()
        return true
    } catch (_) {
        try {
            await connection().getVersion()
            return true
        } catch (__) {
            return false
        }
    }
}

const dummyWallet = {
    publicKey: PublicKey.default,
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
}

const getPda = (programId, pdaName, publicKey) => PublicKey.findProgramAddressSync(
    [Buffer.from(pdaName), publicKey.toBuffer()],
    programId,
)[0]

const getAnchorErrorText = (error) => {
    let message = error?.message || t('unknownError')
    if (error?.error?.errorMessage) {
        message = error.error.errorMessage
    }
    if (error?.error?.errorCode?.number) {
        message = `Anchor error ${error.error.errorCode.number}: ${message}`
    }

    return message
}
