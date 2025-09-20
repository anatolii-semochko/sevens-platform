/**
 * Simple cancellation token for async operations
 */
export class DecompressionCancellationToken {
    constructor() {
        this.cancelled = false
        this.reason = null
    }

    cancel(reason = 'Operation cancelled') {
        this.cancelled = true
        this.reason = reason
    }

    throwIfCancelled() {
        if (this.cancelled) {
            const error = new Error(this.reason)
            error.name = 'CancellationError'
            error.cancelled = true
            throw error
        }
    }

    get isCancelled() {
        return this.cancelled
    }

    reset() {
        this.cancelled = false
        this.reason = null
    }
}

/**
 * Check if error is a cancellation error
 */
export const isCancellationError = (error) => {
    return error?.name === 'CancellationError' || error?.cancelled === true
}
