/**
 * Routes loader that processes the FOS routes file and creates a JavaScript module
 * This solves the async loading issue by making routes available immediately
 */

const fs = require('fs')
const path = require('path')

function createRoutesModule() {
    const routesFilePath = path.resolve(__dirname, '../../../public/build/fos_js_routes.json')
    
    if (!fs.existsSync(routesFilePath)) {
        console.warn('FOS JS routes file not found. Run: docker compose exec php-fpm php bin/console fos:js-routing:dump --target=public/build/fos_js_routes.json --format=json')
        return null
    }

    try {
        const routesContent = fs.readFileSync(routesFilePath, 'utf8')
        
        // Check if it's a JSON format or fos.Router.setData format
        let routesData
        
        if (routesContent.trim().startsWith('{')) {
            // Direct JSON format
            routesData = JSON.parse(routesContent)
        } else {
            // fos.Router.setData format - extract the JSON
            const jsonMatch = routesContent.match(/fos\.Router\.setData\((.*)\);?/)
            
            if (!jsonMatch) {
                console.warn('Could not parse FOS routes file format')
                return null
            }

            routesData = JSON.parse(jsonMatch[1])
        }
        
        // Create a JavaScript module content
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
export const locale = ROUTES_DATA.locale || ''
`

        // Write the routes module
        const outputPath = path.resolve(__dirname, '../../../public/build/routes-data.js')
        fs.writeFileSync(outputPath, moduleContent)
        
        console.log('Generated routes module:', outputPath)
        return outputPath
        
    } catch (error) {
        console.error('Error processing routes file:', error)
        return null
    }
}

module.exports = { createRoutesModule }