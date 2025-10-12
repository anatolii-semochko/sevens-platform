import * as anchor from '@coral-xyz/anchor'
import crypto from 'crypto'
import BN from 'bn.js'
import { PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
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

const mint = async ({
    tokenName = 'Sevens Token',
    hash,
    author = '',
    description = '',
    canBeBurned = false,
    walletPublicKey,
}) => {
    try {
        if (!walletPublicKey) {
            new Error('Wallet public key is required')
        }

        const mint = Keypair.generate()
        const { program, metadataPda, salePda, hashRegistryPda } = getSevensToken(mint.publicKey, hash)

        const payerPublicKey = new PublicKey(walletPublicKey)
        const ownerPublicKey = payerPublicKey

        const accounts = {
            mint: mint.publicKey,
            metadata: metadataPda,
            sale: salePda,
            tokenAccount: getAssociatedTokenAddressSync(mint.publicKey, ownerPublicKey, false, TOKEN_PROGRAM_ID),
            hashRegistry: hashRegistryPda,
            payerAccount: payerPublicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        }

        const ix = await program.methods
            .mintToken(author, hash, description, tokenName, canBeBurned)
            .accounts(accounts)
            .instruction()

        const { blockhash} = await connection.getLatestBlockhash(commitment)
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = payerPublicKey
        tx.recentBlockhash = blockhash
        tx.partialSign(mint)

        return {
            tx,
            mint,
            publicKey: mint.publicKey.toBase58(),
            metadataPublicKey: metadataPda.toBase58(),
            salePublicKey: salePda.toBase58(),
        }
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
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

const setSale = async ({ tokenPublicKey, price, wallet }) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const {
            program,
            salePda,
        } = getSevensToken(mint)

        const tokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey, false, TOKEN_PROGRAM_ID)

        const ix = await program.methods
            .setSale(price > 0, new BN(price * LAMPORTS_PER_SOL))
            .accounts({
                ownerAccount: wallet.publicKey,
                mint,
                tokenAccount,
                sale: salePda,
                saleAuthority: salePda,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()

        const { blockhash } = await connection.getLatestBlockhash(commitment)
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = blockhash

        const txSignature = await wallet.signTransaction(tx)

        const signature = await connection.sendRawTransaction(txSignature.serialize(), {
            skipPreflight: false,
            preflightCommitment: commitment,
        })

        return await connection.confirmTransaction({signature, commitment})
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const buy = async ({ tokenPublicKey, price, wallet }) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const {
            program,
            salePda,
        } = getSevensToken(mint)

        const owner = await getTokenOwner(mint)
        const ownerToken = owner.tokenAccount
        const buyerToken = getAssociatedTokenAddressSync(mint, wallet.publicKey, false, TOKEN_PROGRAM_ID)

        const ix = await program.methods
            .buyToken(new BN(price * LAMPORTS_PER_SOL))
            .accounts({
                buyerAccount: wallet.publicKey,
                ownerAccount: owner.publicKey,
                buyerTokenAccount: buyerToken,
                ownerTokenAccount: ownerToken,
                mint,
                sale: salePda,
                saleAuthority: salePda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .instruction()

        const { blockhash } = await connection.getLatestBlockhash(commitment)
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = blockhash

        const txSignature = await wallet.signTransaction(tx)

        const signature = await connection.sendRawTransaction(txSignature.serialize(), {
            skipPreflight: false,
            preflightCommitment: commitment,
        })

        return await connection.confirmTransaction({signature, commitment})
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

const getTokenOwner = async (tokenPublicKey) => {
    const largestAccounts = await connection.getTokenLargestAccounts(tokenPublicKey)
    const largestAccountInfo = largestAccounts.value[0]
    if (!largestAccountInfo) {
        throw new Error('No token accounts found for this mint.')
    }
    const parsedAccount = await connection.getParsedAccountInfo(largestAccountInfo.address)
    const owner = new PublicKey(parsedAccount.value.data.parsed.info.owner)

    return {
        tokenAccount: largestAccountInfo.address,
        publicKey: owner,
    }
}

export { provider, connection, mint, burn, buy, getData, getTokenByHash, setSale, sevensIdl }
