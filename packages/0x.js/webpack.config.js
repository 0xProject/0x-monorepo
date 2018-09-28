/**
 * This is to generate the umd bundle only
 */
const _ = require('lodash');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const production = process.env.NODE_ENV === 'production';

let entry = {
    index: './src/index.ts',
};
if (production) {
    entry = _.assign({}, entry, { 'index.min': './src/index.ts' });
}

module.exports = {
    entry,
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
        // TODO: Revert to webpack bundled version with webpack v4.
        // The v3 series bundled version does not support ES6 and
        // fails to build.
        new UglifyJsPlugin({
            sourceMap: true,
            uglifyOptions: {
                mangle: {
                    reserved: ['BigNumber'],
                },
            },
        }),
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'awesome-typescript-loader',
                        // tsconfig.json contains some options required for
                        // project references which do not work with webback.
                        // We override those options here.
                        query: {
                            declaration: false,
                            declarationMap: false,
                            composite: false,
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
