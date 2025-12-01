import { useEffect } from 'react'
import { useWebSocket } from '../context/WebSocketContext'

/**
 * Custom hook to subscribe to WebSocket events
 *
 * @param {string} event - The event name to listen for
 * @param {Function} callback - The callback function to execute when event is received
 * @param {Array} deps - Dependency array for the callback
 *
 * @example
 * useWebSocketEvent('rate.changed', (data) => {
 *   console.log('Rate changed:', data.newRate)
 * }, [])
 */
export const useWebSocketEvent = (event, callback, deps = []) => {
  const { on, connected } = useWebSocket()

  useEffect(() => {
    if (!connected) return

    const unsubscribe = on(event, callback)

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [event, connected, ...deps])
}
