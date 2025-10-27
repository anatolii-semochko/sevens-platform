const { PublicKey } = require('@solana/web3.js')
const crypto = require('crypto')
const nacl = require('tweetnacl')
const bs58Module = require('bs58')
const bs58 = bs58Module.default || bs58Module
const db = require('../db/mysql')

class AuthService {
    constructor() {
        this.nonceLength = 32
        this.nonceExpiration = process.env.NONCE_EXPIRATION_MIN * 60 * 1000
    }

    generateNonce() {
        return crypto.randomBytes(this.nonceLength).toString('hex')
    }

    async createNonce(walletAddress) {
        try {
            if (!this.isValidSolanaAddress(walletAddress)) {
                throw new Error('Invalid Solana wallet address')
            }

            await this.cleanupExpiredNonces()

            const existingNonce = await db.findOne('wallet_message_nonces', {
                wallet_address: walletAddress,
                is_used: 0,
            })


            if (existingNonce && !this.isNonceExpired(existingNonce.expires_at)) {
                return {
                    nonce: existingNonce.nonce,
                    expiresAt: existingNonce.expires_at,
                    message: this.createSignMessage(existingNonce.nonce, walletAddress, existingNonce.created_at),
                }
            }

            const nonce = this.generateNonce()
            const now = new Date()
            // Round down to seconds to match MySQL DATETIME precision
            const nowRounded = new Date(Math.floor(now.getTime() / 1000) * 1000)
            const expiresAt = new Date(nowRounded.getTime() + this.nonceExpiration)

            const nonceId = await db.insert('wallet_message_nonces', {
                nonce: nonce,
                wallet_address: walletAddress,
                created_at: nowRounded,
                expires_at: expiresAt,
                is_used: 0,
            })

            const message = this.createSignMessage(nonce, walletAddress, nowRounded)

            return {
                id: nonceId,
                nonce,
                expiresAt,
                message,
            }
        } catch (error) {
            console.error('Error creating nonce:', error)
            throw new Error('Failed to create nonce')
        }
    }

    async verifySignature(walletAddress, signature, nonce) {
        try {
            if (!this.isValidSolanaAddress(walletAddress)) {
                throw new Error('Invalid Solana wallet address')
            }

            const nonceRecord = await db.findOne('wallet_message_nonces', {
                nonce: nonce,
                wallet_address: walletAddress,
            })

            if (!nonceRecord) {
                throw new Error('Nonce not found')
            }

            if (nonceRecord.is_used) {
                throw new Error('Nonce already used')
            }

            if (this.isNonceExpired(nonceRecord.expires_at)) {
                throw new Error('Nonce expired')
            }

            const message = this.createSignMessage(nonce, walletAddress, nonceRecord.created_at)

            const isValid = nacl.sign.detached.verify(
                new TextEncoder().encode(message),
                bs58.decode(signature),
                new PublicKey(walletAddress).toBytes(),
            )

            if (!isValid) {
                throw new Error('Invalid signature')
            }

            await db.update('wallet_message_nonces', {
                is_used: 1,
                used_at: new Date(),
                signature: signature,
            }, {
                id: nonceRecord.id,
            })

            return {
                success: true,
                walletAddress,
                verifiedAt: new Date(),
            }

        } catch (error) {
            console.error('Error verifying signature:', error)
            throw error
        }
    }

    createSignMessage(nonce, walletAddress, createdAt) {
        const timestamp = createdAt instanceof Date ? createdAt.toISOString() : createdAt;

        return `Verify wallet ownership for ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}`
    }

    isValidSolanaAddress(address) {
        try {
            new PublicKey(address)
            return true
        } catch {
            return false
        }
    }

    isNonceExpired(expiresAt) {
        return new Date() > new Date(expiresAt)
    }

    async cleanupExpiredNonces() {
        try {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
            const result = await db.query('DELETE FROM wallet_message_nonces WHERE expires_at < ?', [now])

            if (result.affectedRows > 0) {
                console.log(`Cleaned up ${result.affectedRows} expired nonces`)
            }
        } catch (error) {
            console.error('Error cleaning up expired nonces:', error)
        }
    }

    async getNonceInfo(nonce) {
        return await db.findOne('wallet_message_nonces', { nonce })
    }

    async getUserNonces(walletAddress, limit = 10) {
        return await db.findAll('wallet_message_nonces',
            { wallet_address: walletAddress },
            '*',
            'created_at DESC',
            limit,
        )
    }
}

module.exports = new AuthService()
