import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
    PublicKey,
    SystemProgram,
    SystemInstruction,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
    AddressLookupTableAccount,
} from '@solana/web3.js'

const PROGRAM_IDS = {
    SYSTEM: SystemProgram.programId.toBase58(),
    TOKEN: TOKEN_PROGRAM_ID.toBase58(),
    TOKEN_2022: TOKEN_2022_PROGRAM_ID.toBase58(),
    ATA: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
}

// Load Address Lookup Tables and resolve all account keys
async function resolveAccountKeys(connection, v0Message) {
    const lookups = v0Message.addressTableLookups || []
    if (lookups.length === 0) {
        return v0Message.getAccountKeys()
    }

    const altAccounts = await Promise.all(
        lookups.map(async (l) => {
            const acc = await connection.getAddressLookupTable(l.accountKey)
            return acc.value || new AddressLookupTableAccount({
                key: l.accountKey,
                state: { addresses: [] },
            })
        }),
    )

    return v0Message.getAccountKeys({
        accountKeysFromLookups: {
            writable: altAccounts.flatMap((a) => a.state.addresses),
            readonly: [],
        },
    })
}

// Extract Compute Budget settings (CU limit & price) from instructions
function extractComputeBudgetSettings(v0Message, accountKeys) {
    const instructions = v0Message.compiledInstructions || v0Message.instructions || []
    let cuLimit = null
    let cuPriceMicroLamports = null

    for (const ix of instructions) {
        const programId = accountKeys.get(ix.programIdIndex)
        if (programId.toBase58() === ComputeBudgetProgram.programId.toBase58()) {
            const data = Buffer.from(ix.data)
            const tag = data[0]

            if (tag === 0x02 && data.length >= 5) {
                cuLimit = data.readUInt32LE(1)
            } else if (tag === 0x03 && data.length >= 9) {
                const lo = data.readUInt32LE(1)
                const hi = data.readUInt32LE(5)
                cuPriceMicroLamports = hi * 2 ** 32 + lo
            }
        }
    }
    return { cuLimit, cuPriceMicroLamports }
}

async function estimateBaseFee(connection, v0Message, commitment = 'confirmed') {
    const feeResp = await connection.getFeeForMessage(v0Message, commitment)
    return feeResp?.value ?? null
}

function estimatePriorityFee(unitsConsumed, cuLimit, cuPriceMicroLamports) {
    if (!cuPriceMicroLamports) return 0
    const units = typeof unitsConsumed === 'number' ? unitsConsumed : (cuLimit || 0)
    const used = cuLimit ? Math.min(units, cuLimit) : units
    return Math.floor((Number(cuPriceMicroLamports) * used) / 1_000_000)
}

// Parse instructions: System, SPL Token, and custom programs
function parseInstructions(v0Message, accountKeys) {
    const out = []
    const instructions = v0Message.compiledInstructions || v0Message.instructions || []

    for (const ix of instructions) {
        const programId = accountKeys.get(ix.programIdIndex)
        const prog = programId.toBase58()
        const accountIndexes = ix.accountKeyIndexes || ix.accounts || []
        const accounts = accountIndexes.map((i) => accountKeys.get(i).toBase58())

        let kind = 'unknown'
        let parsed = null

        try {
            if (prog === PROGRAM_IDS.SYSTEM) {
                const legacyIx = {
                    programId,
                    keys: accounts.map((pk) => ({
                        pubkey: new PublicKey(pk),
                        isSigner: false,
                        isWritable: true,
                    })),
                    data: Buffer.from(ix.data),
                }
                const t = SystemInstruction.decodeInstructionType(legacyIx)
                kind = `system.${t}`
                if (t === 'Transfer') {
                    const info = SystemInstruction.decodeTransfer(legacyIx)
                    parsed = {
                        from: info.fromPubkey.toBase58(),
                        to: info.toPubkey.toBase58(),
                        lamports: Number(info.lamports),
                    }
                }
            } else if (prog === PROGRAM_IDS.TOKEN || prog === PROGRAM_IDS.TOKEN_2022) {
                const data = Buffer.from(ix.data)
                const tag = data[0]
                if (tag === 3) {
                    kind = 'spl.transfer'
                    parsed = {
                        source: accounts[0],
                        mint: accounts[1],
                        destination: accounts[2],
                        amount: Number(data.readBigUInt64LE(1)),
                    }
                } else if (tag === 7) {
                    kind = 'spl.mintTo'
                    parsed = {
                        mint: accounts[0],
                        destination: accounts[1],
                        authority: accounts[2],
                        amount: Number(data.readBigUInt64LE(1)),
                    }
                } else if (tag === 8) {
                    kind = 'spl.burn'
                    parsed = {
                        account: accounts[0],
                        mint: accounts[1],
                        authority: accounts[2],
                        amount: Number(data.readBigUInt64LE(1)),
                    }
                } else {
                    kind = 'spl.unknown'
                }
            } else if (prog === PROGRAM_IDS.ATA) {
                kind = 'ata'
            } else {
                kind = 'custom'
            }
        } catch (e) {
            // Leave as unknown
        }

        out.push({
            programId: prog,
            accounts,
            kind,
            parsed,
            rawDataBase64: Buffer.from(ix.data).toString('base64'),
        })
    }
    return out
}

// Parse inner instructions to extract SOL transfers from custom programs
function parseInnerInstructions(innerInstructions, accountKeys) {
    const innerSolTransfers = []

    for (const inner of innerInstructions) {
        const instructions = inner.instructions || []
        for (const ix of instructions) {
            try {
                const programId = accountKeys.get(ix.programIdIndex)
                if (programId.toBase58() === PROGRAM_IDS.SYSTEM) {
                    const accountIndexes = ix.accounts || []
                    const accounts = accountIndexes.map((i) => accountKeys.get(i))
                    const legacyIx = {
                        programId,
                        keys: accounts.map((pk) => ({
                            pubkey: pk,
                            isSigner: false,
                            isWritable: true,
                        })),
                        data: Buffer.from(ix.data),
                    }

                    const type = SystemInstruction.decodeInstructionType(legacyIx)
                    if (type === 'Transfer') {
                        const info = SystemInstruction.decodeTransfer(legacyIx)
                        innerSolTransfers.push({
                            from: info.fromPubkey.toBase58(),
                            to: info.toPubkey.toBase58(),
                            lamports: Number(info.lamports),
                        })
                    }
                }
            } catch (e) {
                console.warn('Failed to parse inner instruction:', e)
            }
        }
    }

    return innerSolTransfers
}

// Build high-level summaries for UI
function buildHighLevelSummaries(parsedIxs) {
    const solTransfers = []
    const splTransfers = []
    const mints = []
    const burns = []

    for (const ix of parsedIxs) {
        if (ix.kind === 'system.Transfer' && ix.parsed) {
            solTransfers.push({
                from: ix.parsed.from,
                to: ix.parsed.to,
                lamports: ix.parsed.lamports,
            })
        }
        if (ix.kind === 'spl.transfer' && ix.parsed) {
            splTransfers.push({
                source: ix.parsed.source,
                destination: ix.parsed.destination,
                mint: ix.parsed.mint,
                amount: ix.parsed.amount,
            })
        }
        if (ix.kind === 'spl.mintTo' && ix.parsed) {
            mints.push({
                mint: ix.parsed.mint,
                destination: ix.parsed.destination,
                amount: ix.parsed.amount,
            })
        }
        if (ix.kind === 'spl.burn' && ix.parsed) {
            burns.push({
                mint: ix.parsed.mint,
                account: ix.parsed.account,
                amount: ix.parsed.amount,
            })
        }
    }

    return { solTransfers, splTransfers, mints, burns }
}

// Normalize any transaction to VersionedTransaction with v0 message
async function toVersioned(connection, txOrVtx) {
    if (txOrVtx instanceof VersionedTransaction) {
        return { vtx: txOrVtx, v0Message: txOrVtx.message }
    }

    if (txOrVtx instanceof Transaction) {
        if (!txOrVtx.recentBlockhash) {
            const { blockhash } = await connection.getLatestBlockhash('processed')
            txOrVtx.recentBlockhash = blockhash
        }

        if (!txOrVtx.feePayer) {
            throw new Error('Transaction.feePayer is required to analyze')
        }

        const msg = new TransactionMessage({
            payerKey: txOrVtx.feePayer,
            recentBlockhash: txOrVtx.recentBlockhash,
            instructions: txOrVtx.instructions,
        }).compileToV0Message()

        return { vtx: new VersionedTransaction(msg), v0Message: msg }
    }

    throw new Error('Unsupported transaction type')
}

// Main simulation and summarization function
export async function simulateAndSummarize(connection, txOrVtx, opts = {}) {
    const commitment = opts.commitment || 'processed'

    const { vtx, v0Message } = await toVersioned(connection, txOrVtx)
    const accountKeys = await resolveAccountKeys(connection, v0Message)
    const payer = accountKeys.get(0)?.toBase58()
    const { cuLimit, cuPriceMicroLamports } = extractComputeBudgetSettings(v0Message, accountKeys)
    const baseFee = await estimateBaseFee(connection, v0Message, commitment)

    // Request innerInstructions to get nested CPI calls
    const sim = await connection.simulateTransaction(vtx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment,
        innerInstructions: true,
    })

    const simErr = sim?.value?.err || null
    const unitsConsumed = sim?.value?.unitsConsumed ?? null
    const logs = sim?.value?.logs || []
    const returnData = sim?.value?.returnData || null
    const preBalances = sim?.value?.preBalances || []
    const postBalances = sim?.value?.postBalances || []
    const innerInstructions = sim?.value?.innerInstructions || []

    const priorityFee = estimatePriorityFee(unitsConsumed, cuLimit, cuPriceMicroLamports)
    const parsedIxs = parseInstructions(v0Message, accountKeys)
    const { solTransfers, splTransfers, mints, burns } = buildHighLevelSummaries(parsedIxs)
    const innerSolTransfers = parseInnerInstructions(innerInstructions, accountKeys)

    // Calculate total expense for payer (3 fallback approaches)
    const calculateExpense = () => {
        let expense = 0
        const payerIndex = accountKeys.staticAccountKeys.findIndex(key => key.toBase58() === payer)

        // Approach 1: Use RPC balance diff (most accurate if available)
        if (payerIndex >= 0 && preBalances.length > 0 && postBalances.length > 0 &&
            payerIndex < preBalances.length && payerIndex < postBalances.length) {
            const balanceDiff = (preBalances[payerIndex] || 0) - (postBalances[payerIndex] || 0)
            if (balanceDiff >= 0) {
                return balanceDiff
            }
        }

        // Approach 2: Parse top-level and inner instructions
        let hasTransfers = false

        solTransfers.forEach(transfer => {
            if (transfer.from === payer) {
                expense += transfer.lamports
                hasTransfers = true
            }
        })

        innerSolTransfers.forEach(transfer => {
            if (transfer.from === payer) {
                expense += transfer.lamports
                hasTransfers = true
            }
        })

        // Approach 3: Scan instruction data for custom programs (fallback)
        if (!hasTransfers) {
            const systemProgramId = PROGRAM_IDS.SYSTEM
            for (const ix of parsedIxs) {
                if ((ix.kind === 'custom' || ix.kind === 'unknown') &&
                    logs.some(log => log.includes(`Program ${systemProgramId} invoke [2]`))) {
                    try {
                        const data = Buffer.from(ix.rawDataBase64, 'base64')
                        // Look for u64 amount after discriminator (offset >= 8)
                        for (let offset = 8; offset <= data.length - 8; offset++) {
                            const amount = Number(data.readBigUInt64LE(offset))
                            if (amount > 5000 && amount < 1_000_000_000_000) {
                                expense += amount
                                break
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to parse instruction data:', e)
                    }
                    break
                }
            }
        }

        return expense
    }

    const touched = []
    const { header } = v0Message
    for (let i = 0; i < accountKeys.staticAccountKeys.length; i++) {
        const pk = accountKeys.staticAccountKeys[i].toBase58()
        const isSigner = i < header.numRequiredSignatures
        const isWritable = i < header.numRequiredSignatures + header.numWritableSignedAccounts ||
            (i >= header.numRequiredSignatures &&
             i < header.numRequiredSignatures + header.numWritableSignedAccounts + header.numWritableUnsignedAccounts)

        touched.push({ pubkey: pk, isSigner, isWritable })
    }

    const fee = (baseFee ?? 0) + (priorityFee ?? 0)
    const expense = calculateExpense()

    return {
        ok: !simErr,
        error: simErr ? JSON.stringify(simErr) : null,
        payer,
        recentBlockhash: v0Message.recentBlockhash,
        pay: {
            baseFee,
            priorityFee,
            fee,
            expense,
            totalCost: expense + fee,
            signaturesCount: header.numRequiredSignatures,
        },
        compute: {
            cuLimit,
            cuPriceMicroLamports,
            unitsConsumed,
        },
        instructions: parsedIxs,
        summaries: {
            solTransfers,
            splTransfers,
            mints,
            burns,
        },
        accountsTouched: touched,
        logs,
        returnData,
    }
}
