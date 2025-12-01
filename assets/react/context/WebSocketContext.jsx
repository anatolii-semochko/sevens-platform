import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

// WebSocket context for real-time updates - v2.0
const WebSocketContext = createContext(null)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [eventListeners, setEventListeners] = useState({})

  useEffect(() => {
    const websocketUrl = `wss://${window.location.host}`
    console.log('[WebSocket] Connecting to:', websocketUrl)

    const socketInstance = io(websocketUrl, {
      path: '/ws/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected:', socketInstance.id)
      setConnected(true)
    })

    socketInstance.on('connected', (data) => {
      console.log('[WebSocket] Server confirmed connection:', data)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason)
      setConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message)
    })

    setSocket(socketInstance)

    return () => {
      console.log('[WebSocket] Cleaning up connection')
      socketInstance.close()
    }
  }, [])

  const on = useCallback(
    (event, callback) => {
      if (!socket) return

      console.log(`[WebSocket] Registering listener for event: ${event}`)
      socket.on(event, callback)

      // Store listener for cleanup
      setEventListeners((prev) => ({
        ...prev,
        [event]: [...(prev[event] || []), callback],
      }))

      return () => {
        console.log(`[WebSocket] Removing listener for event: ${event}`)
        socket.off(event, callback)
      }
    },
    [socket],
  )

  const off = useCallback(
    (event, callback) => {
      if (!socket) return
      socket.off(event, callback)
    },
    [socket],
  )

  const emit = useCallback(
    (event, data) => {
      if (!socket) {
        console.warn('[WebSocket] Cannot emit, socket not connected')
        return
      }
      socket.emit(event, data)
    },
    [socket],
  )

  const value = {
    socket,
    connected,
    on,
    off,
    emit,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
