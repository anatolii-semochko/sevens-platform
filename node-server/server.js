const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const TokenController = require('./controllers/sevensTokenController')
const AuthController = require('./controllers/authController')

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// RESTFul API Routes

// Token routes
app.get('/sevens-tokens', TokenController.getTokens)

// Auth routes
app.get('/auth/nonce', AuthController.getNonce)
app.post('/auth/verify', AuthController.verifySignature)

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
    console.error(err.stack)
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong!',
    })
})

app.listen(port, '0.0.0.0', () => {
    console.log(`Node server running on port ${port}`)
    console.log(`Available endpoints:`)
    console.log(`  Tokens: /node/sevens-tokens?publicKey=xxx`)
    console.log(`  Tokens: /node/sevens-tokens?hash=xxx`)
    console.log(`  Auth nonce: /node/auth/nonce?walletAddress=xxx`)
    console.log(`  Auth verify: POST /node/auth/verify`)
})
