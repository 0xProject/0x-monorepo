const childProcess = require('child_process');
const ip = require('ip');
const path = require('path');
const webpack = require('webpack');

// The common js bundle (not this one) is built using tsc.
// The umd bundle (this one) has a different entrypoint.

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();

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
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                GIT_SHA: JSON.stringify(GIT_SHA),
                ENABLE_HEAP: JSON.stringify(process.env.ENABLE_HEAP),
                NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
            },
        }),
    ],
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
