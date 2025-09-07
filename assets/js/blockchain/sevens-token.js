import * as anchor from '@coral-xyz/anchor'
import BN from 'bn.js'
import { PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { connection, commitment, getPda, getAnchorErrorText } from './sevens'

const sevensIdlPath = '/storage/files/sevens_token.json'

const dummyWallet = {
    publicKey: PublicKey.default,
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
}

const provider = () => new anchor.AnchorProvider(connection, dummyWallet, {});

let sevensIdl
fetch(sevensIdlPath)
    .then(response => response.json())
    .then(idl => sevensIdl = idl)
    .catch(error => console.error(error))

const getSevensToken = (publicKey) => {
    const program = new anchor.Program(sevensIdl, sevensIdl.metadata.address, provider)
    return {
        sevensIdl,
        program,
        metadataPda: publicKey ? getPda(program.programId, 'metadata', publicKey) : null,
        salePda: publicKey ? getPda(program.programId, 'sale', publicKey) : null,
    }
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
        const { program, metadataPda, salePda } = getSevensToken(mint.publicKey)

        const payerPublicKey = new PublicKey(walletPublicKey)
        const ownerPublicKey = payerPublicKey

        const ix = await program.methods
            .mintToken(author, hash, description, tokenName, canBeBurned)
            .accounts({
                mint: mint.publicKey,
                metadata: metadataPda,
                sale: salePda,
                tokenAccount: getAssociatedTokenAddressSync(mint.publicKey, ownerPublicKey),
                mintAuthority: ownerPublicKey,
                payer: payerPublicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .instruction()

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(commitment)
        const tx = new Transaction()
        tx.add(ix)
        tx.feePayer = payerPublicKey
        tx.recentBlockhash = blockhash
        tx.partialSign(mint)

        return {
            tx,
            mint, // Keypair (потрібен як локальний підписант, не передавай у проді за межі безпечного середовища)
            publicKey: mint.publicKey.toBase58(),
            metadataPublicKey: metadataPda.toBase58(),
            salePublicKey: salePda.toBase58(),
        }
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

/**
 * @returns {Promise<string>} txSignature
 */
const burn = async (tokenPublicKey) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const {
            program,
            metadataPda,
            salePda,
        } = getSevensToken(mint)

        const payer = provider().wallet
        const tokenAccount = getAssociatedTokenAddressSync(mint, payer.publicKey)

        return await program.methods
            .burnToken()
            .accounts({
                mint,
                tokenAccount,
                metadata: metadataPda,
                sale: salePda,
                payer: payer.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .rpc()
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

/**
 * @returns {Promise<string>} txSignature
 */
const setSale = async ({ tokenPublicKey, onSale, price }) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const {
            program,
            salePda,
        } = getSevensToken(mint)

        const owner = provider().wallet.publicKey
        const tokenAccount = getAssociatedTokenAddressSync(mint, owner)

        return await program.methods
            .setSale(onSale, new BN(price))
            .accounts({
                owner,
                mint,
                tokenAccount,
                sale: salePda,
                saleAuthority: salePda,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc()
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

/**
 * @returns {Promise<string>} txSignature
 */
const buy = async ({ tokenPublicKey, lamports }) => {
    try {
        const mint = new PublicKey(tokenPublicKey)
        const {
            program,
            salePda,
        } = getSevensToken(mint)

        const owner = await getTokenOwner(mint)
        const ownerToken = owner.tokenAccount
        const buyer = provider().wallet
        const buyerToken = getAssociatedTokenAddressSync(mint, buyer.publicKey)

        return await program.methods
            .buyToken(new BN(lamports))
            .accounts({
                buyer: buyer.publicKey,
                owner: owner.publicKey,
                buyerToken,
                ownerToken,
                mint,
                sale: salePda,
                saleAuthority: salePda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .rpc()
    } catch (error) {
        throw new Error(getAnchorErrorText(error))
    }
}

export { provider, connection, mint, burn, buy, getData, setSale, sevensIdl }
