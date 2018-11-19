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

const HEAP_PRODUCTION_ENV_VAR_NAME = 'INSTANT_HEAP_ANALYTICS_ID_PRODUCTION';
const HEAP_DEVELOPMENT_ENV_VAR_NAME = 'INSTANT_HEAP_ANALYTICS_ID_DEVELOPMENT';
const getHeapAnalyticsId = modeName => {
    if (modeName === 'production') {
        return process.env[HEAP_PRODUCTION_ENV_VAR_NAME];
    }

    if (modeName === 'development') {
        return process.env[HEAP_DEVELOPMENT_ENV_VAR_NAME];
    }

    return undefined;
};

module.exports = (env, argv) => {
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
                    GIT_SHA: JSON.stringify(GIT_SHA),
                    HEAP_ANALYTICS_ID: getHeapAnalyticsId(argv.mode),
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
                        `webpack-dev-server can be accessed externally at: http://${ip.address()}:${
                            config.devServer.port
                        }`,
                    );
                }
            },
        },
    };
    return config;
};
