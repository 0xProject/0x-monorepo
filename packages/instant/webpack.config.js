const path = require('path');
const ip = require('ip');
// The common js bundle (not this one) is built using tsc.
// The umd bundle (this one) has a different entrypoint.
const outputPath = process.env.WEBPACK_OUTPUT_PATH || 'umd';
const config = {
    entry: {
        instant: './src/index.umd.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, outputPath),
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
            {
                test: /\.svg$/,
                loader: 'svg-react-loader',
            },
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        port: 5000,
        host: '0.0.0.0',
        after: () => {
            if (config.devServer.host === '0.0.0.0') {
                console.log(
                    `webpack-dev-server can be accessed externally at: http://${ip.address()}:${config.devServer.port}`,
                );
            }
        },
    },
};

module.exports = config;
