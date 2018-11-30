const childProcess = require('child_process');
const ip = require('ip');
const path = require('path');
const webpack = require('webpack');

const DISCHARGE_TARGETS_THAT_REQUIRED_HEAP = ['production', 'staging', 'dogfood'];
const getConfigForDischargeTarget = dischargeTarget => {
    return {
        heapAnalyticsIdEnvName:
            dischargeTarget === 'production'
                ? 'INSTANT_HEAP_ANALYTICS_ID_PRODUCTION'
                : 'INSTANT_HEAP_ANALYTICS_ID_DEVELOPMENT',
        heapAnalyticsIdRequired: DISCHARGE_TARGETS_THAT_REQUIRED_HEAP.includes(dischargeTarget),
    };
};

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();
const generateConfig = (dischargeTarget, configOptions) => {
    const outputPath = process.env.WEBPACK_OUTPUT_PATH || 'umd';

    const { heapAnalyticsIdEnvName, heapAnalyticsIdRequired } = configOptions;
    const heapAnalyticsId = process.env[heapAnalyticsIdEnvName];
    if (heapAnalyticsIdRequired && !heapAnalyticsId) {
        throw new Error(
            `Must define heap analytics id in ENV var ${heapAnalyticsIdEnvName} when building for ${dischargeTarget}`,
        );
    }

    const envVars = {
        GIT_SHA: JSON.stringify(GIT_SHA),
        NPM_PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version),
    };
    if (dischargeTarget) {
        envVars.INSTANT_DISCHARGE_TARGET = JSON.stringify(dischargeTarget);
    }
    if (heapAnalyticsId) {
        envVars.HEAP_ANALYTICS_ID = JSON.stringify(heapAnalyticsId);
    }
    console.log(envVars);

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
    const dischargeTarget = env ? env.discharge_target : undefined;
    const configOptions = getConfigForDischargeTarget(dischargeTarget);
    return generateConfig(dischargeTarget, configOptions);
};
