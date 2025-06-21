const Encore = require('@symfony/webpack-encore');

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
;

module.exports = Encore.getWebpackConfig();
