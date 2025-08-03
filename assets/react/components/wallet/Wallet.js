import React, { useState, useEffect, useMemo } from 'react'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import '@solana/wallet-adapter-react-ui/styles.css'
import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'
import CryptoJS from 'crypto-js'
import QRCode from 'react-qr-code'
import { showModal } from '@js/modal'
import Translation from '@react/components/translation-help/Translation'
import { getWalletTokens, tokenTransfer } from '@js/blockchain/sevens'

const STORAGE_KEY = 'sevens_wallets'

const connection = new Connection(process.env.ANCHOR_PROVIDER_URL, 'confirmed')

const WalletContent = () => {
    const { publicKey, signTransaction, signMessage } = useWallet()
    const [password, setPassword] = useState('')
    const [unlocked, setUnlocked] = useState(false)
    const [addresses, setAddresses] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [balance, setBalance] = useState(0)
    const [tokens, setTokens] = useState([])

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        setAddresses(stored)
    }, [])

    useEffect(() => {
        if (unlocked && addresses[currentIndex]) {
            const pub = addresses[currentIndex].publicKey
            connection.getBalance(new PublicKey(pub)).then(setBalance)
            getWalletTokens(pub).then(setTokens).catch(() => setTokens([]))
        }
    }, [unlocked, currentIndex, addresses])

    const unlock = () => {
        setUnlocked(true)
    }

    const lock = () => {
        setUnlocked(false)
        setPassword('')
    }

    const addAddress = async () => {
        const isGenerate = window.confirm('Generate new address? Press Cancel to restore from seed')
        let mnemonic
        if (isGenerate) {
            mnemonic = bip39.generateMnemonic()
            alert('Seed phrase:\n' + mnemonic)
        } else {
            mnemonic = window.prompt('Enter seed phrase')
            if (!mnemonic) return
        }
        const seed = await bip39.mnemonicToSeed(mnemonic)
        const { key } = derivePath("m/44'/501'/0'/0'", seed.toString('hex'))
        const kp = Keypair.fromSeed(key)
        const enc = CryptoJS.AES.encrypt(JSON.stringify(Array.from(kp.secretKey)), password).toString()
        const newAddr = { publicKey: kp.publicKey.toBase58(), secret: enc }
        const arr = [...addresses, newAddr]
        setAddresses(arr)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
    }

    const getCurrentKeypair = () => {
        const enc = addresses[currentIndex]
        const decrypted = CryptoJS.AES.decrypt(enc.secret, password).toString(CryptoJS.enc.Utf8)
        const secretArray = JSON.parse(decrypted)
        return Keypair.fromSecretKey(Uint8Array.from(secretArray))
    }

    const sendSol = async () => {
        const to = window.prompt('Target address')
        const amount = parseFloat(window.prompt('Amount SOL'))
        if (!to || !amount) return
        const kp = getCurrentKeypair()
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: kp.publicKey,
                toPubkey: new PublicKey(to),
                lamports: amount * 1e9,
            })
        )
        tx.feePayer = kp.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signed = signTransaction ? await signTransaction(tx) : tx.sign(kp)
        const sig = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(sig)
        alert('Transaction sent: ' + sig)
    }

    const copyAddress = () => {
        if (addresses[currentIndex]) {
            navigator.clipboard.writeText(addresses[currentIndex].publicKey)
        }
    }

    return (
        <div>
            {!unlocked ? (
                <div>
                    <input type="password" className="form-control mb-2" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button className="btn btn-primary" onClick={unlock}><Translation text={'Activate wallet'} /></button>
                </div>
            ) : (
                <div>
                    <div className="d-flex mb-2">
                        <select className="form-select me-2" value={currentIndex} onChange={e => setCurrentIndex(parseInt(e.target.value))}>
                            {addresses.map((a, i) => (
                                <option key={i} value={i}>{a.publicKey.slice(0,4)}...{a.publicKey.slice(-4)}</option>
                            ))}
                        </select>
                        <button className="btn btn-secondary" onClick={addAddress}><Translation text={'Add address'} /></button>
                    </div>
                    {addresses[currentIndex] && (
                        <div>
                            <p><Translation text={'Current address'} />: {addresses[currentIndex].publicKey}</p>
                            <button className="btn btn-sm btn-outline-secondary me-2" onClick={copyAddress}><Translation text={'Copy'} /></button>
                            <QRCode value={addresses[currentIndex].publicKey} size={128} />
                            <p className="mt-2"><Translation text={'Balance'} />: {balance}</p>
                            <ul>
                                {tokens.map((t, idx) => <li key={idx}>{t.name || t.mint}</li>)}
                            </ul>
                            <button className="btn btn-outline-primary me-2" onClick={sendSol}><Translation text={'Send coins'} /></button>
                            <button className="btn btn-warning" onClick={lock}><Translation text={'Lock wallet'} /></button>
                        </div>
                    )}
                </div>
            )}
            <div className="mt-3">
                <WalletMultiButton />
            </div>
        </div>
    )
}

const Wallet = () => {
    const network = WalletAdapterNetwork.Devnet
    const endpoint = process.env.ANCHOR_PROVIDER_URL
    const wallets = useMemo(() => [new PhantomWalletAdapter()], [])
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletContent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

const WalletButton = () => (
    <button className="btn btn-info ms-2" onClick={() => showModal({
        id: 'wallet',
        title: 'Wallet',
        body: <Wallet />,
        size: 'lg',
    })}>
        <Translation text={'Wallet'} />
    </button>
)

export { Wallet, WalletButton }

