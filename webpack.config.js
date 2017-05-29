/**
 * This is to generate the umd bundle only
 */
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        '0x': './src/0x.js.ts',
        '0x.min': './src/0x.js.ts'
    },
    output: {
        path: path.resolve(__dirname, '_bundles'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'ZeroEx',
        umdNamedDefine: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
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
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'awesome-typescript-loader',
                        query: {
                            declaration: false,
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
        ],
    },
};
