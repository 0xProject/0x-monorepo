const childProcess = require('child_process');
const ip = require('ip');
const path = require('path');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const webpack = require('webpack');

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();

const DISCHARGE_TARGETS_THAT_REQUIRED_HEAP = ['production', 'staging', 'dogfood'];
const getHeapConfigForDischargeTarget = dischargeTarget => {
    return {
        heapAnalyticsIdEnvName:
            dischargeTarget === 'production'
                ? 'INSTANT_HEAP_ANALYTICS_ID_PRODUCTION'
                : 'INSTANT_HEAP_ANALYTICS_ID_DEVELOPMENT',
        heapAnalyticsIdRequired: DISCHARGE_TARGETS_THAT_REQUIRED_HEAP.includes(dischargeTarget),
    };
};

const DISCHARGE_TARGETS_THAT_REQUIRE_ROLLBAR = ['production', 'staging', 'dogfood'];
const getRollbarConfigForDischargeTarget = dischargeTarget => {
    if (DISCHARGE_TARGETS_THAT_REQUIRE_ROLLBAR.includes(dischargeTarget)) {
        const rollbarSourceMapPublicPath =
            dischargeTarget === 'production'
                ? 'https://instant.0xproject.com'
                : `http://0x-instant-${dischargeTarget}.s3-website-us-east-1.amazonaws.com`;

        return {
            rollbarSourceMapPublicPath,
            rollbarRequired: true,
        };
    }

    return {
        rollbarRequired: false,
    };
};

const ROLLBAR_CLIENT_TOKEN_ENV_VAR_NAME = 'INSTANT_ROLLBAR_CLIENT_TOKEN';
const ROLLBAR_PUBLISH_TOKEN_ENV_VAR_NAME = 'INSTANT_ROLLBAR_PUBLISH_TOKEN';
const getRollbarTokens = (dischargeTarget, rollbarRequired) => {
    const clientToken = process.env[ROLLBAR_CLIENT_TOKEN_ENV_VAR_NAME];
    const publishToken = process.env[ROLLBAR_PUBLISH_TOKEN_ENV_VAR_NAME];

    if (rollbarRequired) {
        if (!clientToken) {
            throw new Error(
                `Rollbar client token required for ${dischargeTarget}, please set env var ${ROLLBAR_CLIENT_TOKEN_ENV_VAR_NAME}`,
            );
        }
        if (!publishToken) {
            throw new Error(
                `Rollbar publish token required for ${dischargeTarget}, please set env var ${ROLLBAR_PUBLISH_TOKEN_ENV_VAR_NAME}`,
            );
        }
    }

    return { clientToken, publishToken };
};

const generateConfig = (dischargeTarget, heapConfigOptions, rollbarConfigOptions, nodeEnv) => {
    const outputPath = process.env.WEBPACK_OUTPUT_PATH || 'umd';

    const { heapAnalyticsIdEnvName, heapAnalyticsIdRequired } = heapConfigOptions;
    const heapAnalyticsId = process.env[heapAnalyticsIdEnvName];
    if (heapAnalyticsIdRequired && !heapAnalyticsId) {
        throw new Error(
            `Must define heap analytics id in ENV var ${heapAnalyticsIdEnvName} when building for ${dischargeTarget}`,
        );
    }
    const heapEnabled = heapAnalyticsId && (nodeEnv !== 'development' || process.env.INSTANT_HEAP_FORCE_DEVELOPMENT);

    const rollbarTokens = getRollbarTokens(dischargeTarget, rollbarConfigOptions.rollbarRequired);
    const rollbarEnabled =
        rollbarTokens.clientToken && (nodeEnv !== 'development' || process.env.INSTANT_ROLLBAR_FORCE_DEVELOPMENT);

    let rollbarPlugin;
    if (rollbarConfigOptions.rollbarRequired) {
        if (!rollbarEnabled || !rollbarTokens.publishToken || !rollbarConfigOptions.rollbarSourceMapPublicPath) {
            throw new Error(`Rollbar required for ${dischargeTarget} but not configured`);
        }
        rollbarPlugin = new RollbarSourceMapPlugin({
            accessToken: rollbarTokens.publishToken,
            version: GIT_SHA,
            publicPath: rollbarConfigOptions.rollbarSourceMapPublicPath,
        });
    }

    const infuraProjectId =
        dischargeTarget === 'production'
            ? process.env.INSTANT_INFURA_PROJECT_ID_PRODUCTION
            : process.env.INSTANT_INFURA_PROJECT_ID_DEVELOPMENT;

    const envVars = {
        GIT_SHA: JSON.stringify(GIT_SHA),
        NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
        ROLLBAR_ENABLED: rollbarEnabled,
        HEAP_ENABLED: heapEnabled,
        INSTANT_INFURA_PROJECT_ID: JSON.stringify(infuraProjectId),
    };
    if (dischargeTarget) {
        envVars.INSTANT_DISCHARGE_TARGET = JSON.stringify(dischargeTarget);
    }
    if (heapAnalyticsId) {
        envVars.HEAP_ANALYTICS_ID = JSON.stringify(heapAnalyticsId);
    }
    if (rollbarTokens.clientToken) {
        envVars.ROLLBAR_CLIENT_TOKEN = JSON.stringify(rollbarTokens.clientToken);
    }

    const plugins = [
        new webpack.DefinePlugin({
            'process.env': envVars,
        }),
    ];
    if (rollbarPlugin) {
        plugins.push(rollbarPlugin);
    }

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
        node: {
            fs: 'empty',
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
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                plugins: ['transform-runtime'],
                                presets: [
                                    [
                                        'env',
                                        {
                                            targets: {
                                                chrome: 41,
                                            },
                                        },
                                    ],
                                ],
                            },
                        },
                        {
                            loader: 'source-map-loader',
                        },
                    ],
                    exclude: function(modulePath) {
                        return (
                            /node_modules/.test(modulePath) &&
                            /node_modules\/(core-js|lodash|react|websocket)/.test(modulePath)
                        );
                    },
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

module.exports = (env, argv) => {
    const dischargeTarget = env ? env.discharge_target : undefined;
    const heapConfigOptions = getHeapConfigForDischargeTarget(dischargeTarget);
    const rollbarConfigOptions = getRollbarConfigForDischargeTarget(dischargeTarget);
    return generateConfig(dischargeTarget, heapConfigOptions, rollbarConfigOptions, argv.mode);
};
