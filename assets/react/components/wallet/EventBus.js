class WalletEventBus extends EventTarget {
    constructor() {
        super()
        this._listeners = new Map()
    }

    emit(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail })
        this.dispatchEvent(event)
    }

    on(eventName, callback) {
        this.addEventListener(eventName, callback)
        
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, new Set())
        }
        this._listeners.get(eventName).add(callback)
    }

    off(eventName, callback) {
        this.removeEventListener(eventName, callback)
        
        if (this._listeners.has(eventName)) {
            this._listeners.get(eventName).delete(callback)
            if (this._listeners.get(eventName).size === 0) {
                this._listeners.delete(eventName)
            }
        }
    }

    once(eventName, callback) {
        const onceCallback = (event) => {
            callback(event)
            this.off(eventName, onceCallback)
        }
        this.on(eventName, onceCallback)
    }

    removeAllListeners(eventName = null) {
        if (eventName) {
            if (this._listeners.has(eventName)) {
                for (const callback of this._listeners.get(eventName)) {
                    this.removeEventListener(eventName, callback)
                }
                this._listeners.delete(eventName)
            }
        } else {
            for (const [event, callbacks] of this._listeners.entries()) {
                for (const callback of callbacks) {
                    this.removeEventListener(event, callback)
                }
            }
            this._listeners.clear()
        }
    }

    hasListeners(eventName) {
        return this._listeners.has(eventName) && this._listeners.get(eventName).size > 0
    }
}

let instance = null

export const getWalletEventBus = () => {
    if (!instance) {
        instance = new WalletEventBus()
        // Make EventBus globally accessible for debugging
        if (typeof window !== 'undefined') {
            window.__sevensWalletEventBus = instance
        }
    }
    return instance
}

export default getWalletEventBus