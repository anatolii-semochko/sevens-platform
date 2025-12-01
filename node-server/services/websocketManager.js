const { Server } = require('socket.io')
const WebSocket = require('ws')

class WebSocketManager {
    constructor() {
        this.io = null
        this.binanceWs = null
        this.connectedClients = new Map()
        this.currentRate = null
        this.reconnectTimeout = null
        this.reconnectDelay = 5000
    }

    /**
     * Initialize WebSocket server for frontend clients
     */
    initialize(httpServer, binanceWebSocketUrl) {
        // Initialize Socket.IO server for frontend clients
        this.io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
            path: '/socket.io/',
        })

        this.io.on('connection', (socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`)
            this.connectedClients.set(socket.id, socket)

            socket.on('disconnect', () => {
                console.log(`[WebSocket] Client disconnected: ${socket.id}`)
                this.connectedClients.delete(socket.id)
            })

            // Send initial connection confirmation with current rate
            socket.emit('connected', {
                message: 'Successfully connected to Sevenstime WebSocket',
                clientId: socket.id,
                timestamp: new Date().toISOString(),
                currentRate: this.currentRate,
            })
        })

        // Connect to Binance WebSocket
        this.connectToBinance(binanceWebSocketUrl)

        console.log('[WebSocket] WebSocket server initialized')
    }

    /**
     * Connect to Binance WebSocket API
     */
    connectToBinance(binanceWebSocketUrl) {
        if (!binanceWebSocketUrl || !binanceWebSocketUrl.startsWith('wss://')) {
            console.error(`[Binance] Invalid WebSocket URL: ${binanceWebSocketUrl}`)
            return
        }

        console.log(`[Binance] Connecting to: ${binanceWebSocketUrl}`)

        try {
            this.binanceWs = new WebSocket(binanceWebSocketUrl)

            this.binanceWs.on('open', () => {
                console.log('[Binance] Connected successfully')
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout)
                    this.reconnectTimeout = null
                }
            })

            this.binanceWs.on('message', (data) => {
                try {
                    const ticker = JSON.parse(data.toString())

                    // Extract current price from Binance ticker
                    const newRate = parseFloat(ticker.c) // 'c' is current price
                    const oldRate = this.currentRate

                    // Only broadcast if rate actually changed
                    if (newRate !== oldRate) {
                        this.currentRate = newRate

                        // Broadcast rate change to all frontend clients
                        this.emit('rate.changed', {
                            newRate,
                        })

                        console.log(`[Binance] Rate updated: ${oldRate} → ${newRate}`)
                    }
                } catch (error) {
                    console.error('[Binance] Error parsing message:', error.message)
                }
            })

            this.binanceWs.on('error', (error) => {
                console.error('[Binance] WebSocket error:', error.message)
            })

            this.binanceWs.on('close', (code, reason) => {
                console.log(`[Binance] Connection closed: ${code} - ${reason.toString()}`)
                this.attemptReconnect(binanceWebSocketUrl)
            })

            // Handle ping/pong to keep connection alive
            this.binanceWs.on('ping', () => {
                this.binanceWs.pong()
            })

        } catch (error) {
            console.error('[Binance] Connection error:', error.message)
            this.attemptReconnect(binanceWebSocketUrl)
        }
    }

    /**
     * Attempt to reconnect to Binance
     */
    attemptReconnect(binanceWebSocketUrl) {
        if (this.reconnectTimeout) {
            return
        }

        console.log(`[Binance] Attempting to reconnect in ${this.reconnectDelay / 1000}s...`)

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null
            this.connectToBinance(binanceWebSocketUrl)
        }, this.reconnectDelay)
    }

    /**
     * Close Binance connection
     */
    closeBinanceConnection() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }

        if (this.binanceWs) {
            this.binanceWs.close()
            this.binanceWs = null
        }
    }

    /**
     * Emit event to all connected frontend clients
     */
    emit(event, data) {
        if (!this.io) {
            console.error('[WebSocket] WebSocket server not initialized')
            return
        }

        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        })

        console.log(`[WebSocket] Emitted event '${event}' to ${this.connectedClients.size} clients`)
    }

    /**
     * Emit event to specific room
     */
    emitToRoom(room, event, data) {
        if (!this.io) {
            console.error('[WebSocket] WebSocket server not initialized')
            return
        }

        this.io.to(room).emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        })

        console.log(`[WebSocket] Emitted event '${event}' to room '${room}'`)
    }

    /**
     * Get current rate
     */
    getCurrentRate() {
        return this.currentRate
    }

    /**
     * Get number of connected clients
     */
    getClientCount() {
        return this.connectedClients.size
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            serverInitialized: !!this.io,
            binanceConnected: this.binanceWs?.readyState === WebSocket.OPEN,
            connectedClients: this.connectedClients.size,
            currentRate: this.currentRate,
        }
    }
}

module.exports = new WebSocketManager()
