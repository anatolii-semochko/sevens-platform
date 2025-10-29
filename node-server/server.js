const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const TransactionController = require('./controllers/transactionController')
const AuthController = require('./controllers/authController')
const TokenController = require('./controllers/sevensTokenController')
const TariffsController = require('./controllers/tariffsController')
const ManageTokenController = require('./controllers/manageTokenController')

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
app.get('/sevens-token/get-buy-transaction', TokenController.getBuyTransaction) // TODO - deprecated direct query
app.get('/sevens-token/get-burn-transaction', TokenController.getBurnTransaction) // TODO - deprecated direct query

// Managed token operations routes
app.get('/manage/tariffs', TariffsController.getTariffs)
app.get('/manage/tariffs/transaction', TariffsController.getTransaction)

app.post('/manage/mint', ManageTokenController.getMintTransaction)
app.get('/manage/sale-transaction', ManageTokenController.getSaleTransaction)
app.get('/manage/buy-transaction', ManageTokenController.getBuyTransaction)
app.post('/manage/burn-transaction', ManageTokenController.getBurnTransaction)
app.get('/manage/get-data', ManageTokenController.getData)
app.get('/manage/match-data', ManageTokenController.matchData)
app.get('/manage/price', ManageTokenController.getPrice)

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
    console.log(`  Auth nonce: GET /node/auth/nonce?walletAddress=xxx`)
    console.log(`  Auth verify: POST /node/auth/verify`)
    console.log(`  Tokens: GET /node/sevens-token?publicKey=xxx`)
    console.log(`  Tokens: GET /node/sevens-token?hash=xxx`)
    console.log(`  Tokens: GET /node/sevens-token/age-minutes?publicKey=xxx`)
    console.log(`  Managed: GET /node/manage/tariffs`)
    console.log(`  Managed: GET /node/manage/tariffs/transaction`)
    console.log(`  Managed: POST /node/manage/mint`)
    console.log(`  Managed: GET /node/manage/sale-transaction?tokenPublicKey=xxx&price=xxx`)
    console.log(`  Managed: GET /node/manage/buy-transaction?tokenPublicKey=xxx&buyerPublicKey=xxx`)
    console.log(`  Managed: POST /node/manage/burn-transaction`)
    console.log(`  Managed: GET /node/manage/get-data?tokenPublicKey=xxx`)
    console.log(`  Managed: GET /node/manage/match-data?tokenPublicKey=xxx`)
    console.log(`  Managed: GET /node/manage/price?tokenPublicKey=xxx`)
})
