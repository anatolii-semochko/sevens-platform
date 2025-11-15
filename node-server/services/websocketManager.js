const { Server } = require('socket.io')
const { io: ioClient } = require('socket.io-client')

class WebSocketManager {
    constructor() {
        this.io = null
        this.exchangerClient = null
        this.connectedClients = new Map()
        this.currentRate = null
    }

    /**
     * Initialize WebSocket server for frontend clients
     */
    initialize(httpServer, exchangerWebSocketUrl) {
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

        // Connect to sevens-exchanger WebSocket as a client
        this.connectToExchanger(exchangerWebSocketUrl)

        console.log('[WebSocket] WebSocket server initialized')
    }

    /**
     * Connect to sevens-exchanger WebSocket server
     */
    connectToExchanger(exchangerWebSocketUrl) {
        console.log(`[WebSocket] Connecting to exchanger at: ${exchangerWebSocketUrl}`)

        this.exchangerClient = ioClient(exchangerWebSocketUrl, {
            path: '/ws/',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: Infinity,
        })

        this.exchangerClient.on('connect', () => {
            console.log(`[WebSocket] Connected to exchanger: ${this.exchangerClient.id}`)
        })

        this.exchangerClient.on('disconnect', (reason) => {
            console.log(`[WebSocket] Disconnected from exchanger: ${reason}`)
        })

        this.exchangerClient.on('connect_error', (error) => {
            console.error(`[WebSocket] Connection error to exchanger: ${error.message}`)
        })

        // Listen for rate.changed events from exchanger
        this.exchangerClient.on('rate.changed', (data) => {
            console.log(`[WebSocket] Received rate.changed from exchanger:`, data)

            // Update current rate
            this.currentRate = data.newRate

            // Broadcast to all connected frontend clients
            this.emit('rate.changed', data)
        })

        // Listen for initial rate if exchanger sends it
        this.exchangerClient.on('connected', (data) => {
            console.log(`[WebSocket] Exchanger connection confirmed:`, data)
        })
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
            exchangerConnected: this.exchangerClient?.connected || false,
            connectedClients: this.connectedClients.size,
            currentRate: this.currentRate,
        }
    }
}

module.exports = new WebSocketManager()
