const childProcess = require('child_process');
const ip = require('ip');
const path = require('path');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
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

const ROLLBAR_PUBLISH_TOKEN_ENV_NAME = 'INSTANT_ROLLBAR_PUBLISH_TOKEN';
const ROLLBAR_CLIENT_TOKEN_ENV_NAME = 'INSTANT_ROLLBAR_CLIENT_TOKEN';
const getRollbarPlugin = environmentName => {
    if (!environmentName) {
        return undefined;
    }

    const publishToken = process.env[ROLLBAR_PUBLISH_TOKEN_ENV_NAME];
    if (!publishToken) {
        return undefined;
    }

    let rollbarPublicPath;
    if (environmentName === 'dogfood') {
        rollbarPublicPath = 'http://0x-instant-dogfood.s3-website-us-east-1.amazonaws.com';
    } else if (environmentName === 'staging') {
        rollbarPublicPath = 'http://0x-instant-staging.s3-website-us-east-1.amazonaws.com';
    } // TODO(sk): When we decide on JS cdn, add public path here

    if (!rollbarPublicPath) {
        console.log('No rollbar public path');
        return undefined;
    }

    const rollbarPluginOptions = {
        accessToken: publishToken,
        version: GIT_SHA,
        publicPath: rollbarPublicPath,
    };
    return new RollbarSourceMapPlugin(rollbarPluginOptions);
};

const validateRollbar = (environmentName, rollbarPlugin) => {
    const requiresRollbar = environmentName === 'dogfood' || environmentName === 'staging';

    if (!requiresRollbar) {
        return;
    }

    if (!process.env[ROLLBAR_CLIENT_TOKEN_ENV_NAME]) {
        throw new Error(`${ROLLBAR_CLIENT_TOKEN_ENV_NAME} must be set for ${environmentName}`);
    }

    if (!rollbarPlugin) {
        if (environmentName === 'dogfood' || environmentName === 'staging') {
            throw new Error(
                `Please set rollbar env var ${ROLLBAR_PUBLISH_TOKEN_ENV_NAME} to a Rollbar project access token with post_server_item permissions to deploy source maps to ${environmentName}`,
            );
        }
    }
};

module.exports = (env, argv) => {
    const environmentName = getEnvironmentName(env, argv);
    const outputPath = process.env.WEBPACK_OUTPUT_PATH || 'umd';

    let plugins = [
        new webpack.DefinePlugin({
            'process.env': {
                GIT_SHA: JSON.stringify(GIT_SHA),
                NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
                HEAP_ANALYTICS_ID: getHeapAnalyticsId(environmentName),
                ROLLBAR_ENVIRONMENT: JSON.stringify(environmentName),
                ROLLBAR_CLIENT_TOKEN: JSON.stringify(process.env[ROLLBAR_CLIENT_TOKEN_ENV_NAME]),
                ROLLBAR_FORCE_DEVELOPMENT_REPORT: JSON.stringify(process.env.INSTANT_ROLLBAR_FORCE_DEVELOPMENT_REPORT),
            },
        }),
    ];

    const rollbarPlugin = getRollbarPlugin(environmentName);
    if (rollbarPlugin) {
        console.log('Using rollbar plugin');
        plugins = plugins.concat(rollbarPlugin);
    } else {
        console.log('Not using rollbar plugin');
    }
    validateRollbar(environmentName, rollbarPlugin);

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
        plugins,
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
                {
                    test: /\.js$/,
                    loader: 'source-map-loader',
                    exclude: [
                        // instead of /\/node_modules\//
                        path.join(process.cwd(), 'node_modules'),
                        path.join(process.cwd(), '../..', 'node_modules'),
                    ],
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
