const crypto = require('crypto');

// Auth controller for wallet authentication
class AuthController {
    // In-memory storage for nonces (in production, use Redis or database)
    static nonces = new Map();

    // GET /auth/nonce
    static async getNonce(req, res) {
        try {
            const { walletAddress } = req.query;

            if (!walletAddress) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'walletAddress query parameter is required'
                });
            }

            // Generate a random nonce
            const nonce = crypto.randomBytes(32).toString('hex');
            const timestamp = Date.now();

            // Store nonce with expiration (5 minutes)
            AuthController.nonces.set(walletAddress, {
                nonce,
                timestamp,
                expires: timestamp + (5 * 60 * 1000) // 5 minutes
            });

            // Clean up expired nonces
            AuthController.cleanupExpiredNonces();

            res.json({
                success: true,
                data: {
                    nonce,
                    message: `Please sign this message to authenticate with Sevens Time:\n\nNonce: ${nonce}\nTimestamp: ${new Date(timestamp).toISOString()}`,
                    timestamp
                }
            });
        } catch (error) {
            console.error('Error generating nonce:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to generate nonce'
            });
        }
    }

    // POST /auth/verify
    static async verifySignature(req, res) {
        try {
            const { walletAddress, signature, message } = req.body;

            if (!walletAddress || !signature || !message) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'WalletAddress, signature, and message are required'
                });
            }

            // Get stored nonce
            const storedData = AuthController.nonces.get(walletAddress);

            if (!storedData) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'No nonce found for this wallet address'
                });
            }

            // Check if nonce is expired
            if (Date.now() > storedData.expires) {
                AuthController.nonces.delete(walletAddress);
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Nonce has expired'
                });
            }

            // TODO: Implement actual signature verification using Solana Web3.js
            // This should verify that the signature was created by the wallet
            // with the private key corresponding to walletAddress

            // For now, just check if the message contains the nonce
            if (!message.includes(storedData.nonce)) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid signature or message'
                });
            }

            // Remove used nonce
            AuthController.nonces.delete(walletAddress);

            // Generate a simple session token (in production, use JWT)
            const sessionToken = crypto.randomBytes(32).toString('hex');

            res.json({
                success: true,
                data: {
                    authenticated: true,
                    walletAddress,
                    sessionToken,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error verifying signature:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to verify signature'
            });
        }
    }

    // Clean up expired nonces
    static cleanupExpiredNonces() {
        const now = Date.now();
        for (const [address, data] of AuthController.nonces.entries()) {
            if (now > data.expires) {
                AuthController.nonces.delete(address);
            }
        }
    }
}

module.exports = AuthController;
