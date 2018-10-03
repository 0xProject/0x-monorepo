const path = require('path');
// The common js bundle (not this one) is built using tsc.
// The umd bundle (this one) has a different entrypoint.
module.exports = {
    entry: './src/index.umd.ts',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'public'),
        library: 'zeroExInstant',
        libraryTarget: 'umd',
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.json', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'awesome-typescript-loader',
            },
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        port: 5000,
    },
};
