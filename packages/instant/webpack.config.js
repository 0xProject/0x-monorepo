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
const getRollbarSourceMapPlugin = environmentName => {
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
const validateRollbarPresence = (environmentName, rollbarEnabled, rollbarSourceMapPlugin) => {
    const requiresRollbar = environmentName === 'dogfood' || environmentName === 'staging';
    if (!requiresRollbar) {
        return;
    }
    if (!rollbarEnabled || !rollbarSourceMapPlugin) {
        throw new Error(
            `Rollbar env vars must be set to build for ${environmentName}. Please set ${ROLLBAR_CLIENT_TOKEN_ENV_NAME} to a rollbar access token with post_client_item permissions, and ${ROLLBAR_PUBLISH_TOKEN_ENV_NAME} to a rollbar access token with post_server_item permissions.`,
        );
    }
};

module.exports = (env, argv) => {
    const environmentName = getEnvironmentName(env, argv);
    const outputPath = process.env.WEBPACK_OUTPUT_PATH || 'umd';

    const envVars = {
        GIT_SHA: JSON.stringify(GIT_SHA),
        NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
        HEAP_ANALYTICS_ID: getHeapAnalyticsId(environmentName),
        INSTANT_ENVIRONMENT: JSON.stringify(environmentName),
        ROLLBAR_CLIENT_TOKEN: JSON.stringify(process.env[ROLLBAR_CLIENT_TOKEN_ENV_NAME]),
    };

    const canRollbarBeEnabled =
        environmentName === 'development' ? process.env.INSTANT_ROLLBAR_FORCE_DEVELOPMENT_REPORT : true;
    if (envVars.INSTANT_ENVIRONMENT && envVars.ROLLBAR_CLIENT_TOKEN && canRollbarBeEnabled) {
        envVars['ROLLBAR_ENABLED'] = JSON.stringify(true);
    }

    let plugins = [
        new webpack.DefinePlugin({
            'process.env': envVars,
        }),
    ];
    const rollbarSourceMapPlugin = getRollbarSourceMapPlugin(environmentName);
    if (rollbarSourceMapPlugin) {
        console.log('Using rollbar source map plugin');
        plugins = plugins.concat(rollbarSourceMapPlugin);
    } else {
        console.log('Not using rollbar source map plugin');
    }
    validateRollbarPresence(environmentName, envVars['ROLLBAR_ENABLED'], rollbarSourceMapPlugin);

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
