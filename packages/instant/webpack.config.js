const path = require('path');
const webpack = require('webpack');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const childProcess = require('child_process');

// The common js bundle (not this one) is built using tsc.
// The umd bundle (this one) has a different entrypoint.

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();

const ROLLBAR_ACCESS_KEY_ENV_NAME = 'ZEROEX_INSTANT_ROLLBAR_POST_ACCESS_KEY';
function getPlugins(webpackEnv) {
    const basePlugins = [
        new webpack.DefinePlugin({
            'process.env': {
                GIT_SHA: JSON.stringify(GIT_SHA),
            },
        }),
    ];

    let rollbarPublicPath;
    if (webpackEnv.dogfood) {
        rollbarPublicPath = 'http://0x-instant-dogfood.s3-website-us-east-1.amazonaws.com';
    } else if (webpackEnv.staging) {
        rollbarPublicPath = 'http://0x-instant-staging.s3-website-us-east-1.amazonaws.com';
    }

    if (!rollbarPublicPath) {
        console.log('Excluding rollbar sourcemap plugin');
        return basePlugins;
    }

    const rollbarAccessKey = process.env[ROLLBAR_ACCESS_KEY_ENV_NAME];
    if (!rollbarAccessKey) {
        throw new Error(
            `Need environment variable ${ROLLBAR_ACCESS_KEY_ENV_NAME} set to deploy source maps. Access key must have post_server_item permissions`,
        );
    }

    console.log('Using rollbar source map plugin for', rollbarPublicPath, 'with sha', GIT_SHA);
    return basePlugins.concat([
        new RollbarSourceMapPlugin({
            accessToken: rollbarAccessKey,
            version: GIT_SHA,
            publicPath: rollbarPublicPath,
        }),
    ]);
}

module.exports = (env, argv) => {
    const plugins = getPlugins(env || {});
    return {
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
        plugins,
    };
};
