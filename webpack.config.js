const Encore = require('@symfony/webpack-encore');
const path = require('path');

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')

    // App для звичайних публічних сторінок
    .addEntry('app', './assets/app/app.js')
    
    .copyFiles({
        from: './assets/img',
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
;

module.exports = Encore.getWebpackConfig();
