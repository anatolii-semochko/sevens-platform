import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useWebSocketEvent } from '../../hooks/useWebSocketEvent'

/**
 * Component that listens for rate updates via WebSocket
 * and updates the Redux store
 */
export const RateUpdateListener = () => {
  const dispatch = useDispatch()

  // Load initial rate from API on mount
  useEffect(() => {
    const loadInitialRate = async () => {
      try {
        // Always use /node for browser requests (proxied by nginx)
        const response = await axios.get('/node/rate')

        if (response.data && typeof response.data.rate === 'number') {
          dispatch({
            type: 'SET',
            solUsdRate: response.data.rate,
          })
          console.log('[RateUpdateListener] Initial rate loaded:', response.data.rate)
        }
      } catch (error) {
        console.error('[RateUpdateListener] Failed to load initial rate:', error)
      }
    }

    loadInitialRate().then()
  }, [dispatch])

  // Listen for rate.changed events via WebSocket
  useWebSocketEvent(
    'rate.changed',
    (eventData) => {
      if (eventData && typeof eventData.newRate === 'number') {
        dispatch({
          type: 'SET',
          solUsdRate: eventData.newRate,
        })
      }
    },
    [dispatch],
  )

  // This component doesn't render anything
  return null
}
