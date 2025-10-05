/**
 * Routing helper with automatic locale support from Redux store
 *
 * Usage example:
 * import { route, routeWithLocale } from '@js/routing-with-locale';
 *
 * // Automatically includes current locale
 * const url = route('check_token'); // Results in /uk/check-token
 *
 * // Use in React component
 * <a href={route('check_token')}>Check Token</a>
 */

// @ts-ignore
import store from '@react/store/index'

interface RouteData {
    tokens: Array<Array<string | boolean>>
    defaults?: Record<string, any>
    requirements?: Record<string, string>
    hosttokens?: Array<any>
    methods?: string[]
    schemes?: string[]
}

interface RoutesData {
    routes: Record<string, RouteData>
    base_url?: string
    prefix?: string
    host?: string
    port?: string
    scheme?: string
    locale?: string
}

export interface RouteParams {
    [key: string]: string | number | boolean
}

// Global routing state
let routesData: RoutesData | null = null

/**
 * Load routes data
 */
function loadRoutes(): void {
    if (routesData) return

    try {
        // Try to import the generated routes data
        const data = require('../../../public/build/routes-data.js').default as RoutesData
        routesData = data
    } catch (error) {
        console.warn('Could not load routes data:', error)
        routesData = { routes: {} }
    }
}

/**
 * Get current locale from Redux store
 */
function getCurrentLocale(): string {
    const state = store.getState()
    return state.currentLocale || 'uk' // Default to 'uk' if not set
}

/**
 * Build path from tokens
 */
function buildPath(tokens: Array<Array<string | boolean>>, params: RouteParams, defaults: Record<string, any>): string {
    let path = ''
    const allParams = { ...defaults, ...params }

    // Process tokens in reverse order (FOS routing generates them backwards)
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i]
        const [type, value, pattern, name] = token

        if (type === 'text') {
            path += (value as string)
        } else if (type === 'variable') {
            const paramName = name as string
            if (allParams.hasOwnProperty(paramName)) {
                path += (value as string) + encodeURIComponent(String(allParams[paramName]))
            } else if (token[4] === false) { // not optional
                console.error(`Required parameter "${paramName}" is missing for route`)
                return '#'
            }
        }
    }

    return path
}

/**
 * Extract parameter names from tokens
 */
function extractUsedParams(tokens: Array<Array<string | boolean>>): string[] {
    const params: string[] = []

    for (const token of tokens) {
        if (token[0] === 'variable') {
            params.push(token[3] as string)
        }
    }

    return params
}

/**
 * Generate URL for a route
 */
function generateRoute(name: string, params: RouteParams = {}, absolute: boolean = false): string {
    loadRoutes()

    if (!routesData) {
        console.error('Routes data not loaded')
        return '#'
    }

    const route = routesData.routes[name]
    if (!route) {
        console.error(`Route "${name}" not found`)
        return '#'
    }

    let url = buildPath(route.tokens, params, route.defaults || {})

    // Add query parameters for extra params
    const usedParams = extractUsedParams(route.tokens)
    const queryParams: Record<string, string> = {}

    for (const [key, value] of Object.entries(params)) {
        if (!usedParams.includes(key) && !(route.defaults && route.defaults.hasOwnProperty(key))) {
            queryParams[key] = String(value)
        }
    }

    if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString()
        url += (url.includes('?') ? '&' : '?') + queryString
    }

    // Make absolute if requested
    if (absolute && routesData) {
        const baseUrl = routesData.base_url || `${routesData.scheme}://${routesData.host}${routesData.port ? ':' + routesData.port : ''}`
        url = baseUrl + url
    }

    return url
}

/**
 * Generate a route URL with automatic locale injection
 * @param name - Route name
 * @param params - Route parameters
 * @param absolute - Generate absolute URL
 * @returns Generated URL with locale
 */
export function route(name: string, params: RouteParams = {}, absolute: boolean = false): string {
    loadRoutes()

    if (!routesData) {
        return '#'
    }

    // Inject current locale if not provided and route has _locale parameter
    const routeData = routesData.routes[name]
    if (routeData && !params._locale) {
        // Check if route has _locale parameter
        const hasLocaleParam = routeData.tokens.some(token =>
            token[0] === 'variable' && token[3] === '_locale'
        )

        if (hasLocaleParam) {
            params = { ...params, _locale: getCurrentLocale() }
        }
    }

    return generateRoute(name, params, absolute)
}

/**
 * Generate a route URL with explicit locale
 * @param name - Route name
 * @param locale - Specific locale to use
 * @param params - Route parameters
 * @param absolute - Generate absolute URL
 * @returns Generated URL with specified locale
 */
export function routeWithLocale(name: string, locale: string, params: RouteParams = {}, absolute: boolean = false): string {
    const paramsWithLocale = { ...params, _locale: locale }
    return generateRoute(name, paramsWithLocale, absolute)
}

/**
 * Check if a route exists
 * @param name - Route name
 * @returns boolean
 */
export function routeExists(name: string): boolean {
    loadRoutes()
    return routesData ? routesData.routes.hasOwnProperty(name) : false
}

/**
 * Get all available route names
 * @returns Array of route names
 */
export function getRoutes(): string[] {
    loadRoutes()
    return routesData ? Object.keys(routesData.routes) : []
}

/**
 * Generate absolute URL for a route with locale
 * @param name - Route name
 * @param params - Route parameters
 * @returns Generated absolute URL with locale
 */
export function absoluteRoute(name: string, params: RouteParams = {}): string {
    return route(name, params, true)
}

/**
 * Enhanced Routing object with locale support
 */
export const RoutingWithLocale = {
    /**
     * Generate URL with automatic locale injection
     */
    generate(name: string, params: RouteParams = {}, absolute: boolean = false): string {
        return route(name, params, absolute)
    },

    /**
     * Check if route exists
     */
    has(name: string): boolean {
        return routeExists(name)
    },

    /**
     * Get route names
     */
    getRouteNames(): string[] {
        return getRoutes()
    },

    /**
     * Get current locale
     */
    getCurrentLocale(): string {
        return getCurrentLocale()
    },

    /**
     * Generate with specific locale
     */
    generateWithLocale(name: string, locale: string, params: RouteParams = {}, absolute: boolean = false): string {
        return routeWithLocale(name, locale, params, absolute)
    }
}

// Simple helper functions are already exported above

export default {
    route,
    routeWithLocale,
    routeExists,
    getRoutes,
    absoluteRoute,
    RoutingWithLocale,
}
