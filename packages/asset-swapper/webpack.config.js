/**
 * This is to generate the umd bundle only
 */
const _ = require('lodash');
const TerserPlugin = require('terser-webpack-plugin');
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
    mode: 'production',
    output: {
        path: path.resolve(__dirname, '_bundles'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'AssetSwapper',
        umdNamedDefine: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    devtool: 'source-map',
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                terserOptions: {
                    mangle: {
                        reserved: ['BigNumber'],
                    },
                },
            }),
        ],
    },
    externals: {
        fs: true,
    },
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
        ],
    },
};
