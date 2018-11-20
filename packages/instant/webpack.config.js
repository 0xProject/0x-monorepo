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

const getEnvironmentName = (env, argv) => {
    if (env && env.dogfood) {
        return 'dogfood';
    } else if (env && env.staging) {
        return 'staging';
    }

    // argv.mode should be 'development' or 'production'
    return argv.mode;
};

const getHeapAnalyticsId = environmentName => {
    if (environmentName === 'production') {
        return process.env['INSTANT_HEAP_ANALYTICS_ID_PRODUCTION'];
    }

    if (environmentName === 'development' || environmentName === 'dogfood' || environmentName === 'staging') {
        return process.env['INSTANT_HEAP_ANALYTICS_ID_DEVELOPMENT'];
    }

    return undefined;
};

module.exports = (env, argv) => {
    const environmentName = getEnvironmentName(env, argv);
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
                    NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
                    HEAP_ANALYTICS_ID: getHeapAnalyticsId(environmentName),
                    ROLLBAR_ENVIRONMENT: JSON.stringify(environmentName),
                    ROLLBAR_CLIENT_TOKEN: JSON.stringify(process.env.INSTANT_ROLLBAR_CLIENT_TOKEN),
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
