const express = require('express')
const http = require('http')
const helmet = require('helmet')
const cors = require('cors')

const WebSocketController = require('./controllers/websocketController')
const TransactionController = require('./controllers/transactionController')
const AuthController = require('./controllers/authController')
const WalletController = require('./controllers/walletController')
const TokenController = require('./controllers/sevensTokenController')
const TariffsController = require('./controllers/tariffsController')
const ManageTokenController = require('./controllers/manageTokenController')

const websocketManager = require('./services/websocketManager')

const app = express()
const server = http.createServer(app)
const port = process.env.NODE_SERVER_PORT

// Initialize WebSocket
const binanceWebSocketUrl = process.env.EXCHANGER_WEBSOCKET_URL
websocketManager.initialize(server, binanceWebSocketUrl)

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// RESTFul API Routes

// WebSocket routes
app.get('/websocket/status', WebSocketController.getStatus)
app.post('/websocket/emit', WebSocketController.emitEvent)
app.get('/rate', WebSocketController.getRate)

// Transaction routes
app.post('/transaction/send', TransactionController.sendTransaction)
app.post('/transaction/match', TransactionController.matchTransactionAndSignature)

// Wallet routes
app.get('/wallet/balance', WalletController.getBalance)

// Auth routes
app.get('/auth/nonce', AuthController.getNonce)
app.post('/auth/verify', AuthController.verifySignature)

// Token routes
app.get('/sevens-token', TokenController.getTokens)
app.get('/sevens-token/age-minutes', TokenController.getAgeMinutes)

// Token operation tariffs routes
app.get('/manage/tariffs', TariffsController.getTariffs)
app.get('/manage/tariffs/transaction', TariffsController.getTransaction)

// Token operations routes
app.get('/manage/mint-transaction', ManageTokenController.getMintTransaction)
app.get('/manage/sale-transaction', ManageTokenController.getSaleTransaction)
app.get('/manage/buy-transaction', ManageTokenController.getBuyTransaction)
app.get('/manage/burn-transaction', ManageTokenController.getBurnTransaction)
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

server.listen(port, '0.0.0.0', () => {
    console.log(`  Node server running on port ${port}`)
    console.log(`  Available endpoints:`)
    console.log(`  WebSocket: GET /node/websocket/status`)
    console.log(`  WebSocket: POST /node/websocket/emit (internal)`)
    console.log(`  WebSocket Client: ws://localhost:${port}/ws/socket.io/`)
    console.log(`  WebSocket: GET /node/rate`)
    console.log(`  Transactions: POST /node/transaction/send`)
    console.log(`  Transactions: POST /node/transaction/match`)
    console.log(`  Wallet: GET /node/wallet/balance?walletAddress=xxx`)
    console.log(`  Auth nonce: GET /node/auth/nonce?walletAddress=xxx`)
    console.log(`  Auth verify: POST /node/auth/verify`)
    console.log(`  Tokens: GET /node/sevens-token?publicKey|hash|walletPublicKey=xxx`)
    console.log(`  Tokens: GET /node/sevens-token?hash=xxx`)
    console.log(`  Tokens: GET /node/sevens-token/age-minutes?publicKey=xxx`)
    console.log(`  Managed: GET /node/manage/tariffs`)
    console.log(`  Managed: GET /node/manage/tariffs/transaction`)
    console.log(`  Managed: GET /node/manage/mint-transaction?walletPublicKey=xxx&mintPublicKey=xxx&tokenName=xxx&hash=xxx&author=xxx&description=xxx&canBeBurned=xxx`)
    console.log(`  Managed: GET /node/manage/sale-transaction?tokenPublicKey=xxx&price=xxx`)
    console.log(`  Managed: GET /node/manage/buy-transaction?tokenPublicKey=xxx&buyerPublicKey=xxx`)
    console.log(`  Managed: GET /node/manage/burn-transaction?tokenPublicKey=xxx`)
    console.log(`  Managed: GET /node/manage/get-data?tokenPublicKey=xxx`)
    console.log(`  Managed: GET /node/manage/match-data?tokenPublicKey=xxx`)
    console.log(`  Managed: GET /node/manage/price?tokenPublicKey=xxx`)
})
