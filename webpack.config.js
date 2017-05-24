/**
 * This is to generate the umd bundle only
 */
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        '0x': './src/ts/0x.js.ts',
        '0x.min': './src/ts/0x.js.ts'
    },
    output: {
        path: path.resolve(__dirname, '_bundles'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'ZeroEx',
        umdNamedDefine: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: 'source-map',
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true,
            include: /\.min\.js$/,
        }),
    ],
    module: {
        loaders: [{
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            exclude: /node_modules/,
            query: {
                declaration: false,
            },
        }],
    },
};
