import * as anchor from '@coral-xyz/anchor'
import crypto from 'crypto'
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { connection, commitment, getPda, getAnchorErrorText } from './sevens'

const dummyWallet = {
    publicKey: PublicKey.default,
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
}

const provider = () => new anchor.AnchorProvider(connection, dummyWallet, {});

let sevensIdl
fetch(process.env.SEVENS_TOKEN_IDL_PATH)
    .then(response => response.json())
    .then(idl => sevensIdl = idl)
    .catch(error => console.error(error))

const getSevensToken = (publicKey, hash = null) => {
    const program = new anchor.Program(sevensIdl, sevensIdl.metadata.address, provider())
    return {
        sevensIdl,
        program,
        metadataPda: publicKey ? getPda(program.programId, 'metadata', publicKey) : null,
        salePda: publicKey ? getPda(program.programId, 'sale', publicKey) : null,
        hashRegistryPda: hash ? getHashPda(program.programId, hash) : null,
    }
}

const getHashPda = (programId, hash) => {
    const hashOfHash = crypto.createHash('sha256').update(hash).digest()
    const shortHashBuffer = hashOfHash.slice(0, 28)
    return PublicKey.findProgramAddressSync(
        [Buffer.from('hash'), shortHashBuffer],
        programId,
    )[0]
}

const getTokenByHash = async (hash) => {
    try {
        const { program } = getSevensToken(null, hash)
        const hashRegistryPda = getHashPda(program.programId, hash)
        const hashRegistry = await program.account.hashRegistry.fetch(hashRegistryPda)
        const mintPublicKey = hashRegistry.mintKey.toString()

        // Check if the SPL token mint still exists
        const mintPublicKeyObj = new PublicKey(mintPublicKey)
        const mintAccountInfo = await connection.getAccountInfo(mintPublicKeyObj)

        const tokenData = await getData(mintPublicKey)

        if (!mintAccountInfo) {
            // Token mint was burned/closed, but metadata still exists
            //tokenData.error = "The token was burned and is no longer accessible. However, the burn was partial (as standard SPL token) — the metadata representing the hash of this container is still present on the blockchain."
        }

        return tokenData
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const getData = async (tokenPublicKey) => {
    try {
        const publicKey = new PublicKey(tokenPublicKey)
        const {
            program,
            metadataPda,
            salePda,
            hashRegistryPda,
        } = getSevensToken(publicKey)

        const metadata = await program.account.trustDataMetadata.fetch(metadataPda)
        const sale = await program.account.tokenSaleData.fetch(salePda)

        sale.priceLamports = sale.price.toNumber()
        sale.priceSevens = sale.price.toNumber() / LAMPORTS_PER_SOL

        const walletPublicKey = await getWalletPublicKeyByToken(tokenPublicKey)

        return {
            tokenPublicKey,
            walletPublicKey,
            mintingTime: new Date(metadata.timestamp.toNumber() * 1000).toISOString(),
            hashRegistry: hashRegistryPda,
            metadata,
            sale,
        }
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const getWalletPublicKeyByToken = async (tokenPublicKey) => {
    let walletPublicKey = null
    try {
        const publicKey = new PublicKey(tokenPublicKey)
        const mintInfo = await connection.getParsedAccountInfo(publicKey)
        const supply = mintInfo?.value?.data?.parsed?.info?.supply

        if (supply === '1') {
            // For NFT (supply = 1), find the token account holder
            const tokenAccounts = await connection.getTokenLargestAccounts(publicKey)
            if (tokenAccounts?.value?.length > 0) {
                const largestAccount = tokenAccounts.value[0]
                const tokenAccountInfo = await connection.getParsedAccountInfo(largestAccount.address)
                walletPublicKey = tokenAccountInfo?.value?.data?.parsed?.info?.owner
            }
        }

        return walletPublicKey
    } catch (walletError) {
        throw new Error(getAnchorErrorText(walletError))
    }
}

/**
 * @returns {Promise<string>} txSignature
 */
const burn = async (tokenPublicKey, walletPublicKey) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const tokenData = await getData(tokenPublicKey)
        const hash = tokenData.metadata.hash

        const {
            program,
            metadataPda,
            salePda,
            hashRegistryPda,
        } = getSevensToken(mint, hash)

        const payerPublicKey = new PublicKey(walletPublicKey)
        const tokenAccount = getAssociatedTokenAddressSync(mint, payerPublicKey, false, TOKEN_PROGRAM_ID)

        const ix = await program.methods
            .burnToken()
            .accounts({
                mint,
                tokenAccount,
                metadata: metadataPda,
                sale: salePda,
                hashRegistry: hashRegistryPda,
                payerAccount: payerPublicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(commitment)
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = payerPublicKey
        tx.recentBlockhash = blockhash

        return { tx }
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const getWalletTokens = async (walletPublicKey) => {
    try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(walletPublicKey),
            {programId: TOKEN_PROGRAM_ID},
        )

        const tokens = []
        for (const accountInfo of tokenAccounts.value) {
            const accountData = accountInfo.account.data.parsed.info
            const amount = parseInt(accountData.tokenAmount.amount, 10)
            const decimals = parseInt(accountData.tokenAmount.decimals, 10)
            if (amount === 1 && decimals === 0) {
                tokens.push(accountData.mint)
            }
        }

        return tokens
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export {
    provider, connection, sevensIdl,
    burn,
    getData, getTokenByHash, getWalletTokens,
}
