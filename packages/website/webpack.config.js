const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const childProcess = require('child_process');

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();

const generatePlugins = () => {
    let plugins = [];
    if (process.env.NODE_ENV === 'production') {
        plugins = plugins.concat([
            // Since we do not use moment's locale feature, we exclude them from the bundle.
            // This reduces the bundle size by 0.4MB.
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                    GIT_SHA: JSON.stringify(GIT_SHA),
                },
            }),
            // TODO: Revert to webpack bundled version with webpack v4.
            // The v3 series bundled version does not support ES6 and
            // fails to build.
            new UglifyJsPlugin({
                sourceMap: true,
                uglifyOptions: {
                    mangle: {
                        reserved: ['BigNumber'],
                    },
                },
            }),
        ]);
        if (process.env.DEPLOY_ROLLBAR_SOURCEMAPS === 'true') {
            plugins = plugins.concat([
                new RollbarSourceMapPlugin({
                    accessToken: '32c39bfa4bb6440faedc1612a9c13d28',
                    version: GIT_SHA,
                    publicPath: 'https://0xproject.com/',
                }),
            ]);
        }
    }
    return plugins;
};
module.exports = {
    entry: ['./ts/index.tsx'],
    output: {
        path: path.join(__dirname, '/public'),
        filename: 'bundle.js',
        chunkFilename: 'bundle-[name].js',
        publicPath: '/',
    },
    devtool: 'source-map',
    resolve: {
        modules: [path.join(__dirname, '/ts'), 'node_modules'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
        alias: {
            ts: path.join(__dirname, '/ts'),
            less: path.join(__dirname, '/less'),
            md: path.join(__dirname, '/md'),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'source-map-loader',
                exclude: [
                    // instead of /\/node_modules\//
                    path.join(process.cwd(), 'node_modules'),
                    path.join(process.cwd(), '../..', 'node_modules'),
                ],
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
            },
            {
                test: /\.md$/,
                use: 'raw-loader',
            },
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader'],
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
        ],
    },
    devServer: {
        port: 3572,
        historyApiFallback: {
            // Fixes issue where having dots in URL path that aren't part of fileNames causes webpack-dev-server
            // to fail. Doc versions have dots in them, therefore we special case these urls to also load index.html.
            // Source: https://github.com/cvut/fittable/issues/171
            rewrites: [
                {
                    from: /^\/docs\/.*$/,
                    to: function() {
                        return 'index.html';
                    },
                },
            ],
        },
        disableHostCheck: true,
    },
    plugins: generatePlugins(),
};
