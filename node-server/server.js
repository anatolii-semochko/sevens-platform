const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const TransactionController = require('./controllers/transactionController')
const AuthController = require('./controllers/authController')
const TokenController = require('./controllers/sevensTokenController')
const TariffsController = require('./controllers/tariffsController')

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// RESTFul API Routes

// Transaction routes
app.post('/transaction/send', TransactionController.sendTransaction)
app.post('/transaction/match', TransactionController.matchTransactionAndSignature)

// Auth routes
app.get('/auth/nonce', AuthController.getNonce)
app.post('/auth/verify', AuthController.verifySignature)

// Token routes
app.get('/sevens-token', TokenController.getTokens)
app.get('/sevens-token/age-minutes', TokenController.getAgeMinutes)
app.get('/sevens-token/get-buy-transaction', TokenController.getBuyTransaction)
app.get('/sevens-token/get-burn-transaction', TokenController.getBurnTransaction)

// Tariffs routes
app.get('/tariffs', TariffsController.getTariffs)
app.get('/tariffs/get-transaction', TariffsController.getTransaction)

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint was not found',
    })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err?.stack)
    res?.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong!',
    })
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Node server running on port ${port}`)
    console.log(`Available endpoints:`)
    console.log(`  Transactions: POST /node/transaction/send`)
    console.log(`  Transactions: POST /node/transaction/match`)
    console.log(`  Auth nonce: /node/auth/nonce?walletAddress=xxx`)
    console.log(`  Auth verify: POST /node/auth/verify`)
    console.log(`  Tokens: /node/sevens-token?publicKey=xxx`)
    console.log(`  Tokens: /node/sevens-token?hash=xxx`)
    console.log(`  Tokens: /node/sevens-token/age-minutes?publicKey=xxx`)
    console.log(`  Tokens: /node/sevens-token/get-buy-transaction?tokenPublicKey=xxx&buyerPublicKey=xxx`)
    console.log(`  Tokens: /node/sevens-token/get-burn-transaction?tokenPublicKey=xxx`)
    console.log(`  Tariffs: GET /node/tariffs`)
    console.log(`  Tariffs: GET /node/tariffs/get-transaction?authorityPublicKey=xxx&targetWallet=xxx&mint=xxx&setSale=xxx&buy=xxx&burn=xxx`)
})
