/**
 * Webpack plugin for FOS JS Routing generation
 * This plugin automatically generates routes before webpack compilation
 */

const { execSync } = require('child_process')
const fs = require('fs')

class FOSJsRoutingPlugin {
    apply(compiler) {
        // Run after the cleanup but before compilation
        compiler.hooks.thisCompilation.tap('FOSJsRoutingPlugin', (compilation) => {
            this.generateRoutes(compilation)
        })
    }

    generateRoutes(compilation) {
            try {
                console.log("\nChecking FOS JS Routing routes...")

                // Try to read the FOS routes file from a backup location or original location
                let routesPath = 'fos_js_routes.json'
                if (fs.existsSync('public/build/fos_js_routes.json')) {
                    routesPath = 'public/build/fos_js_routes.json'
                } else if (fs.existsSync('fos_js_routes.json')) {
                    routesPath = 'fos_js_routes.json'
                }

                if (fs.existsSync(routesPath)) {
                    console.log('✅ Routes file exists, generating routes module...')

                    // Read the FOS routes data
                    const routesContent = fs.readFileSync(routesPath, 'utf8')
                    const routesData = JSON.parse(routesContent)

                    // Create the routes-data.js content
                    const moduleContent = `// Auto-generated FOS JS routes
// This file is generated automatically. Do not edit manually.

const ROUTES_DATA = ${JSON.stringify(routesData, null, 2)}

export default ROUTES_DATA
export const routes = ROUTES_DATA.routes || {}
export const base_url = ROUTES_DATA.base_url || ''
export const prefix = ROUTES_DATA.prefix || ''
export const host = ROUTES_DATA.host || ''
export const port = ROUTES_DATA.port || ''
export const scheme = ROUTES_DATA.scheme || ''
export const locale = ROUTES_DATA.locale || ''`

                    // Add both files as webpack assets with proper structure
                    const { RawSource } = require('webpack-sources')

                    compilation.assets['fos_js_routes.json'] = new RawSource(routesContent)
                    compilation.assets['routes-data.js'] = new RawSource(moduleContent)

                    console.log('✅ Routes files added to webpack assets')
                } else {
                    console.log('FOS JS routes file not found. Run: docker compose exec php-fpm php bin/console fos:js-routing:dump --target=public/build/fos_js_routes.json --format=json')
                }

            } catch (error) {
                console.warn('Warning: Could not process FOS JS Routing routes:', error.message)
            }
    }
}

module.exports = FOSJsRoutingPlugin
