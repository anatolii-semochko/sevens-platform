const Encore = require('@symfony/webpack-encore')
const path = require('path')
require('dotenv').config()

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')

    // App для звичайних публічних сторінок
    .addEntry('app', './assets/app.js')

    .copyFiles({
        from: './assets/images',
        to: 'images/[path][name].[ext]',
    })

    .enableReactPreset()

    .enableSassLoader()
    .enablePostCssLoader()

    .splitEntryChunks()
    .enableSingleRuntimeChunk()

    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    .enableVersioning(Encore.isProduction())

    // // Параметри dev-server
    // .configureDevServerOptions(options => {
    //     options.host = '0.0.0.0'; // щоб було доступно ззовні
    //     options.port = 8080;
    //     options.static = {
    //         directory: path.resolve(__dirname, 'public'),
    //     };
    //     options.devMiddleware = {
    //         publicPath: '/build/',
    //     };
    //     options.hot = true; // гарячий перезавантажувач
    // })

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
}

const webpack = require('webpack')
config.plugins.push(
    new webpack.DefinePlugin({
        'process.env.ANCHOR_PROVIDER_URL': JSON.stringify(process.env.ANCHOR_PROVIDER_URL),
    })
)

module.exports = config
