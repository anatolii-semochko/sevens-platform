import React, { useEffect, useRef } from 'react'
import { isTimeOut } from '@react/api/indexApi'
import { LoaderBlock } from '@react/components/info-componnents/Messages'

/**
 * Universal component for repeatable API queries with timeout handling
 *
 * @param {Function} apiEndpoint - API function to call (e.g., (params) => tokenApi.getTokenDataByHash(params))
 * @param {any} params - Parameters to pass to apiEndpoint
 * @param {Function} onSuccess - Callback called with data on successful response
 * @param {Function} onError - Optional callback called with error when non-timeout error occurs
 * @param {boolean} processing - State controlling when query should run (set to true to start)
 * @param {Function} setProcessing - Setter for processing state
 * @param {string} loadingMessage - Optional custom loading message (default: 'Loading...')
 * @param {boolean} cancelButton - Show Cancel button
 * @param {Function} onCancel - Optional callback called when user clicks Cancel
 * @param {string} className - Optional Block class
 *
 * @example
 * const [loadingToken, setLoadingToken] = useState(false)
 *
 * useEffect(() => {
 *   if (someCondition) {
 *     setLoadingToken(true)
 *   }
 * }, [someCondition])
 *
 * return (
 *   <RepeatableQuery
 *     apiEndpoint={(hash) => tokenApi.getTokenDataByHash(hash)}
 *     params={container?.hash}
 *     onSuccess={setTokenData}
 *     onError={() => setTokenData({ error: 'Token not found' })}
 *     processing={loadingToken}
 *     setProcessing={setLoadingToken}
 *     loadingMessage={'Checking token...'}
 *   />
 * )
 */
export const RepeatableQuery = ({
    apiEndpoint,
    params,
    onSuccess,
    onError,
    processing,
    setProcessing,
    loadingMessage = 'Loading...',
    cancelButton = true,
    onCancel,
    className,
}) => {
    const isActiveRef = useRef(true)

    useEffect(() => {
        if (!processing) return

        isActiveRef.current = true

        const getData = async () => {
            try {
                const data = await apiEndpoint(params)
                if (!isActiveRef.current) {
                    return
                }
                onSuccess(data)
                setProcessing(false)
            } catch (error) {
                if (!isActiveRef.current) {
                    return
                }
                if (isTimeOut(error)) {
                    console.log('REPEAT - timeout occurred')
                    await getData()
                } else {
                    if (onError) {
                        onError(error)
                    }
                    setProcessing(false)
                }
            }
        }

        getData().finally()

        return () => {
            isActiveRef.current = false
        }
    }, [processing])

    const cancel = () => {
        isActiveRef.current = false
        setProcessing(false)
        if (onCancel) {
            onCancel()
        }
    }

    if (!processing) return null

    return (
        <div className={className}>
            <LoaderBlock message={loadingMessage} />
            {cancelButton && (
                <button className="btn btn-danger fs-4 w-100 p-3 mt-4" onClick={() => cancel()} >
                    Cancel
                </button>
            )}
        </div>
    )
}
