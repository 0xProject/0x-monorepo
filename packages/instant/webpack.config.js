const childProcess = require('child_process');
const ip = require('ip');
const path = require('path');
const webpack = require('webpack');

// The common js bundle (not this one) is built using tsc.
// The umd bundle (this one) has a different entrypoint.

const ACCEPTABLE_ENV_NAMES = ['production_standalone', 'production_cdn', 'staging', 'dogfood', 'development'];
const getEnvironmentName = env => {
    if (!env) {
        throw new Error('Please specify env via --env to webpack');
    }
    const foundName = ACCEPTABLE_ENV_NAMES.find(e => (env[e] ? e : false));
    if (!foundName) {
        throw new Error(
            `Couldn't find env name, please specify via one of the following CLI arguments: ${acceptableEnvNames.map(
                i => `--env.${i}`,
            )}`,
        );
    }
    return foundName;
};

const getConfigForEnv = environmentName => {
    switch (environmentName) {
        case 'production_standalone':
        case 'production_cdn':
            return {
                heapAnalyticsIdEnvName: 'INSTANT_HEAP_ANALYTICS_ID_PRODUCTION',
                heapAnalyticsIdRequired: environmentName !== 'production_standalone',
            };
        case 'staging':
        case 'dogfood':
        case 'development':
            return {
                heapAnalyticsIdEnvName: 'INSTANT_HEAP_ANALYTICS_ID_DEVELOPMENT',
                heapAnalyticsIdRequired: environmentName !== 'development',
            };
    }
};

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();
const generateConfig = (environmentName, configOptions) => {
    const outputPath = process.env.WEBPACK_OUTPUT_PATH || 'umd';

    const { heapAnalyticsIdEnvName, heapAnalyticsIdRequired } = configOptions;
    const heapAnalyticsId = process.env[heapAnalyticsIdEnvName];
    if (heapAnalyticsIdRequired && !heapAnalyticsId) {
        throw new Error(
            `Must define heap analytics id in ENV var ${heapAnalyticsIdEnvName} when building for ${environmentName}`,
        );
    }

    const envVars = {
        GIT_SHA: JSON.stringify(GIT_SHA),
        INSTANT_ENVIRONMENT: JSON.stringify(environmentName),
        NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
    };
    if (heapAnalyticsId) {
        envVars.HEAP_ANALYTICS_ID = JSON.stringify(heapAnalyticsId);
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
        plugins: [
            new webpack.DefinePlugin({
                'process.env': envVars,
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

module.exports = (env, _argv) => {
    const environmentName = getEnvironmentName(env);
    const configOptions = getConfigForEnv(environmentName);
    return generateConfig(environmentName, configOptions);
};
