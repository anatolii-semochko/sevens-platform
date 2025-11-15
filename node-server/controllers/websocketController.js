const websocketManager = require('../services/websocketManager')
const {
    success,
    badResponse,
    checkIsNotEmpty,
    badRequest,
} = require("../utils/controller");

class WebSocketController {
    /**
     * Get current rate
     */
    static getRate(req, res) {
        try {
            const rate = websocketManager.getCurrentRate()

            if (rate === null) {
                return res.status(503).json({
                    error: 'Rate not available',
                    message: 'Rate data has not been received from exchanger yet',
                })
            }

            res.json({ rate })
        } catch (error) {
            badResponse('[WebSocketController] Error getting rate', res, req, error, 500)
        }
    }

    /**
     * Get WebSocket status
     */
    static getStatus(req, res) {
        try {
            res.json(websocketManager.getStatus())
        } catch (error) {
            badResponse('[WebSocketController] Error getting status', res, req, error, 500)
        }
    }

    /**
     * Emit event to all clients (for internal use)
     */
    static emitEvent(req, res) {
        const { event, data, room } = req.body

        try {
            checkIsNotEmpty(event, 'event')
        } catch (e) {
            return badRequest(res, e)
        }

        try {
            if (room) {
                websocketManager.emitToRoom(room, event, data || {})
            } else {
                websocketManager.emit(event, data || {})
            }

            success(res, `Event '${event}' emitted successfully`)
        } catch (error) {
            badResponse('[WebSocketController] Error emitting event', res, req, error, 500)
        }
    }
}

module.exports = WebSocketController
