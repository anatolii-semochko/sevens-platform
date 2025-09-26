import {
    Connection,
    PublicKey,
    SystemProgram,
    SystemInstruction,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
    AddressLookupTableAccount,
} from "@solana/web3.js";

// TODO - Analyze and clean

/** === Константи програм === */
export const PROGRAM_IDS = {
    SYSTEM: SystemProgram.programId.toBase58(),
    TOKEN: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",        // SPL Token v1
    TOKEN_2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",   // SPL Token 2022
    ATA: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",         // Associated Token
};

/** === Допоміжне: завантажити ALT-и і отримати всі account keys для message === */
async function resolveAccountKeys(connection, v0Message) {
    const lookups = v0Message.addressTableLookups || [];
    if (lookups.length === 0) {
        return v0Message.getAccountKeys(); // без lookups
    }
    // Завантажуємо ALT акаунти
    const altAccounts = await Promise.all(
        lookups.map(async (l) => {
            const acc = await connection.getAddressLookupTable(l.accountKey);
            if (acc.value) return acc.value;
            // якщо ALT не знайдено — робимо порожній
            return new AddressLookupTableAccount({ key: l.accountKey, state: { addresses: [] } });
        })
    );
    return v0Message.getAccountKeys({
        accountKeysFromLookups: {
            writable: altAccounts.flatMap((a) => a.state.addresses),
            readonly: [],
        },
    });
}

/** === Витягти Compute Budget (CU limit & CU price) з інструкцій === */
function extractComputeBudgetSettings(v0Message, accountKeys) {
    const instructions = v0Message.compiledInstructions || v0Message.instructions || [];
    let cuLimit = null;
    let cuPriceMicroLamports = null;

    for (const ix of instructions) {
        const programId = accountKeys.get(ix.programIdIndex);
        const prog = programId.toBase58();
        if (prog === ComputeBudgetProgram.programId.toBase58()) {
            // простий парсер для двох інструкцій ComputeBudget
            const data = Buffer.from(ix.data);
            const tag = data[0]; // перший байт — тип інструкції
            // 0x02 = setComputeUnitLimit (у більшості версій web3.js)
            // 0x03 = setComputeUnitPrice
            if (tag === 0x02 && data.length >= 5) {
                cuLimit = data.readUInt32LE(1);
            } else if (tag === 0x03 && data.length >= 9) {
                // u64 (microLamports)
                const lo = data.readUInt32LE(1);
                const hi = data.readUInt32LE(5);
                cuPriceMicroLamports = hi * 2 ** 32 + lo;
            }
        }
    }
    return { cuLimit, cuPriceMicroLamports };
}

/** === Оцінити базову комісію через getFeeForMessage === */
async function estimateBaseFeeLamports(connection, v0Message, commitment = "confirmed") {
    const feeResp = await connection.getFeeForMessage(v0Message, commitment);
    return feeResp?.value ?? null; // lamports
}

/** === Оцінити пріоритетну комісію з урахуванням CU === */
function estimatePriorityFeeLamports(unitsConsumed, cuLimit, cuPriceMicroLamports) {
    if (!cuPriceMicroLamports) return 0;
    const units = typeof unitsConsumed === "number" ? unitsConsumed : (cuLimit || 0);
    const used = cuLimit ? Math.min(units, cuLimit) : units; // лімітуємо, якщо задано
    return Math.floor((Number(cuPriceMicroLamports) * used) / 1_000_000); // microLamports -> lamports
}

/** === Парсинг інструкцій: System transfer + мінімальний SPL Token === */
function parseInstructions(v0Message, accountKeys) {
    const out = [];
    // v0Message має compiledInstructions, а не instructions
    const instructions = v0Message.compiledInstructions || v0Message.instructions || [];

    for (const ix of instructions) {
        const programId = accountKeys.get(ix.programIdIndex);
        const prog = programId.toBase58();

        // У compiledInstructions accountKeyIndexes замість accounts
        const accountIndexes = ix.accountKeyIndexes || ix.accounts || [];
        const accounts = accountIndexes.map((i) => accountKeys.get(i).toBase58());

        let kind = "unknown";
        let parsed = null;

        try {
            if (prog === PROGRAM_IDS.SYSTEM) {
                // Спробуємо скористатись SystemInstruction
                const legacyIx = {
                    programId,
                    keys: accounts.map((pk) => ({ pubkey: new PublicKey(pk), isSigner: false, isWritable: true })),
                    data: Buffer.from(ix.data),
                };
                const t = SystemInstruction.decodeInstructionType(legacyIx);
                kind = `system.${t}`;
                if (t === "Transfer") {
                    const info = SystemInstruction.decodeTransfer(legacyIx);
                    parsed = {
                        from: info.fromPubkey.toBase58(),
                        to: info.toPubkey.toBase58(),
                        lamports: Number(info.lamports),
                    };
                }
            } else if (prog === PROGRAM_IDS.TOKEN || prog === PROGRAM_IDS.TOKEN_2022) {
                // Дуже базовий парсер: Transfer(3), MintTo(7), Burn(8)
                const data = Buffer.from(ix.data);
                const tag = data[0];
                if (tag === 3) {
                    kind = "spl.transfer";
                    const amount = Number(data.readBigUInt64LE(1));
                    parsed = { source: accounts[0], mint: accounts[1], destination: accounts[2], amount };
                } else if (tag === 7) {
                    kind = "spl.mintTo";
                    const amount = Number(data.readBigUInt64LE(1));
                    parsed = { mint: accounts[0], destination: accounts[1], authority: accounts[2], amount };
                } else if (tag === 8) {
                    kind = "spl.burn";
                    const amount = Number(data.readBigUInt64LE(1));
                    parsed = { account: accounts[0], mint: accounts[1], authority: accounts[2], amount };
                } else {
                    kind = "spl.unknown";
                }
            } else if (prog === PROGRAM_IDS.ATA) {
                kind = "ata";
            }
        } catch (e) {
            // залишаємо unknown
        }

        out.push({
            programId: prog,
            accounts,
            kind,
            parsed,
            rawDataBase64: Buffer.from(ix.data).toString("base64"),
        });
    }
    return out;
}

/** === Збірка підсумків (SOL/SPL перекази, mint-и) для UI === */
function buildHighLevelSummaries(parsedIxs) {
    const solTransfers = [];
    const splTransfers = [];
    const mints = [];
    const burns = [];

    for (const ix of parsedIxs) {
        if (ix.kind === "system.Transfer" && ix.parsed) {
            solTransfers.push({
                from: ix.parsed.from,
                to: ix.parsed.to,
                lamports: ix.parsed.lamports,
            });
        }
        if (ix.kind === "spl.transfer" && ix.parsed) {
            splTransfers.push({
                source: ix.parsed.source,
                destination: ix.parsed.destination,
                mint: ix.parsed.mint,
                amount: ix.parsed.amount,
            });
        }
        if (ix.kind === "spl.mintTo" && ix.parsed) {
            mints.push({
                mint: ix.parsed.mint,
                destination: ix.parsed.destination,
                amount: ix.parsed.amount,
            });
        }
        if (ix.kind === "spl.burn" && ix.parsed) {
            burns.push({
                mint: ix.parsed.mint,
                account: ix.parsed.account,
                amount: ix.parsed.amount,
            });
        }
    }

    return { solTransfers, splTransfers, mints, burns };
}

/** === Нормалізувати будь-яку транзакцію до VersionedTransaction + v0Message === */
async function toVersioned(connection, txOrVtx) {
    if (txOrVtx instanceof VersionedTransaction) {
        return { vtx: txOrVtx, v0Message: txOrVtx.message };
    }
    if (txOrVtx instanceof Transaction) {
        // Якщо legacy — зберемо v0 message
        console.log('Converting legacy Transaction to v0')

        // Use existing blockhash if available
        if (!txOrVtx.recentBlockhash) {
            const { blockhash } = await connection.getLatestBlockhash("processed");
            txOrVtx.recentBlockhash = blockhash;
        }

        if (!txOrVtx.feePayer) {
            throw new Error("Transaction.feePayer is required to analyze");
        }

        console.log('Creating TransactionMessage with:', {
            payerKey: txOrVtx.feePayer.toString(),
            recentBlockhash: txOrVtx.recentBlockhash,
            instructions: txOrVtx.instructions.length
        })

        const msg = new TransactionMessage({
            payerKey: txOrVtx.feePayer,
            recentBlockhash: txOrVtx.recentBlockhash,
            instructions: txOrVtx.instructions,
        }).compileToV0Message(); // v0 — для коректного fee та ALT

        console.log('v0Message created:', msg)

        return { vtx: new VersionedTransaction(msg), v0Message: msg };
    }
    throw new Error("Unsupported transaction type");
}

/** === Головна функція: симуляція + зведення для UI === */
export async function simulateAndSummarize(connection, txOrVtx, opts = {}) {
    const commitment = opts.commitment || "processed";

    // 1) Нормалізуємо до v0
    const { vtx, v0Message } = await toVersioned(connection, txOrVtx);

    // 2) Витягуємо всі акаунти (включно з ALT)
    const accountKeys = await resolveAccountKeys(connection, v0Message);
    const payer = accountKeys.get(0)?.toBase58();

    // 3) Compute Budget налаштування
    const { cuLimit, cuPriceMicroLamports } = extractComputeBudgetSettings(v0Message, accountKeys);

    // 4) Оцінка базової комісії
    const baseFeeLamports = await estimateBaseFeeLamports(connection, v0Message, commitment);

    // 5) Симуляція (без перевірки підписів, підставляємо актуальний blockhash)
    const sim = await connection.simulateTransaction(vtx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment,
    });

    const simErr = sim?.value?.err || null;
    const unitsConsumed = sim?.value?.unitsConsumed ?? null;
    const logs = sim?.value?.logs || [];
    const returnData = sim?.value?.returnData || null;

    // 6) Пріоритетна комісія на базі симуляції
    const priorityFeeLamports = estimatePriorityFeeLamports(unitsConsumed, cuLimit, cuPriceMicroLamports);

    // 7) Повний список інструкцій (розпарсений)
    const parsedIxs = parseInstructions(v0Message, accountKeys);
    const { solTransfers, splTransfers, mints, burns } = buildHighLevelSummaries(parsedIxs);

    // 8) Список всіх дотичних акаунтів (з ознаками signer/writable)
    const touched = [];
    for (let i = 0; i < accountKeys.staticAccountKeys.length; i++) {
        const pk = accountKeys.staticAccountKeys[i].toBase58();
        touched.push({
            pubkey: pk,
            isSigner: i < v0Message.header.numRequiredSignatures,
            isWritable:
                i < v0Message.header.numRequiredSignatures + v0Message.header.numWritableSignedAccounts ||
                i >= v0Message.header.numRequiredSignatures &&
                i < v0Message.header.numRequiredSignatures +
                v0Message.header.numWritableSignedAccounts +
                v0Message.header.numWritableUnsignedAccounts,
        });
    }

    return {
        ok: !simErr,
        error: simErr ? JSON.stringify(simErr) : null, // конвертуємо error в string для React
        payer,
        recentBlockhash: v0Message.recentBlockhash,
        fee: {
            baseFeeLamports,                 // базова плата за підписи
            priorityFeeLamports,             // оцінка пріоритетної (за CU)
            estimatedTotalLamports:
                (baseFeeLamports ?? 0) + (priorityFeeLamports ?? 0),
            lamportsPerSignature: null,      // за бажанням: витягни через getRecentPrioritizationFees/feeCalculator (нестабільно)
            signaturesCount: v0Message.header.numRequiredSignatures,
        },
        compute: {
            cuLimit,
            cuPriceMicroLamports,
            unitsConsumed,                   // із симуляції (найкорисніше число)
        },
        instructions: parsedIxs,           // деталізовані інструкції з акаунтами
        summaries: {
            solTransfers,
            splTransfers,
            mints,
            burns,
        },
        accountsTouched: touched,
        logs,
        returnData,                        // якщо програма повертає дані
    };
}

/** === Зручний варіант: приймає сирий message (наприклад, якщо ти сам його збираєш) === */
export async function summarizeMessage(connection, v0MessageLike, commitment = "processed") {
    const vtx = new VersionedTransaction(v0MessageLike);
    return simulateAndSummarize(connection, vtx, { commitment });
}

/** === Пакетний варіант для signAllTransactions (масив) === */
export async function simulateAndSummarizeAll(connection, txs, commitment = "processed") {
    const results = [];
    for (const t of txs) {
        try {
            const r = await simulateAndSummarize(connection, t, { commitment });
            results.push(r);
        } catch (e) {
            results.push({ ok: false, error: e?.message || String(e) });
        }
    }
    return results;
}
