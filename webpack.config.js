require('dotenv').config()
const FOSJsRoutingPlugin = require('./assets/js/router/webpack-plugin')
const Encore = require('@symfony/webpack-encore')
const path = require('path')
const webpack = require('webpack')
const fs = require('fs')

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')

    .addEntry('app', './assets/app.js')

    .copyFiles({
        from: './assets/images',
        to: 'images/[path][name].[ext]',
    })

    .enableReactPreset()
    .enableTypeScriptLoader()

    .enableSassLoader()
    .enablePostCssLoader()

    .splitEntryChunks()
    .enableSingleRuntimeChunk()

    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    .enableVersioning(Encore.isProduction())

module.exports = Encore.getWebpackConfig()

const config = Encore.getWebpackConfig()
config.resolve.alias = {
    '@': path.resolve(__dirname, 'assets'),
    '@js': path.resolve(__dirname, 'assets/js'),
    '@css': path.resolve(__dirname, 'assets/css'),
    '@react': path.resolve(__dirname, 'assets/react'),
}
config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    vm: false,
    process: require.resolve('process'),
    buffer: require.resolve('buffer'),
    http: false,
    https: false,
    os: false,
    path: false,
    fs: false,
}

config.plugins.push(
    new FOSJsRoutingPlugin(),
    new webpack.DefinePlugin({
        'process.env.ANCHOR_PROVIDER_URL': JSON.stringify(process.env.ANCHOR_PROVIDER_URL),
        'process.env.SEVENS_TOKEN_IDL_PATH': JSON.stringify(process.env.SEVENS_TOKEN_IDL_PATH),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        'process.env.NONCE_EXPIRATION_MIN': JSON.stringify(process.env.NONCE_EXPIRATION_MIN || 30),
        'process.env.BROWSER_FILE_MEMORY_DECOMPRESSION_LIMIT': JSON.stringify(process.env.BROWSER_FILE_MEMORY_DECOMPRESSION_LIMIT),
        'process.env.NODE_SERVER_BASE_URL': JSON.stringify(process.env.NODE_SERVER_BASE_URL),
    }),
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process',
    })
)

module.exports = config

const src = require.resolve('streamsaver/sw.js')
const dst = path.resolve(__dirname, 'public/build/streamsaver-sw.js')
fs.mkdirSync(path.dirname(dst), { recursive: true })
fs.copyFileSync(src, dst)
