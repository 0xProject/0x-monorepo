const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const childProcess = require('child_process');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const GIT_SHA = childProcess
    .execSync('git rev-parse HEAD')
    .toString()
    .trim();

const config = {
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
                test: /\.svg$/,
                use: [
                    {
                        loader: "react-svg-loader",
                        options: {
                            svgo: {
                                plugins: [
                                    { removeViewBox: false }
                                ],
                            }
                        }
                    }
                ]
            },
        ],
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                terserOptions: {
                    mangle: {
                        reserved: ['BigNumber'],
                    },
                },
            }),
        ],
    },
    devServer: {
        host: '0.0.0.0',
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
        // Fixes assertion error
        // Source: https://github.com/webpack/webpack-dev-server/issues/1491
        https: {
            spdy: {
                protocols: ['http/1.1']
            }
        },
    },
};

module.exports = (_env, argv) => {
    let plugins = [];
    if (argv.mode === 'development') {
        config.mode = 'development';
        plugins.concat([
            new BundleAnalyzerPlugin(),
        ]);
    } else {
        config.mode = 'production';
        plugins = plugins.concat([
            // Since we do not use moment's locale feature, we exclude them from the bundle.
            // This reduces the bundle size by 0.4MB.
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.DefinePlugin({
                'process.env': {
                    GIT_SHA: JSON.stringify(GIT_SHA),
                },
            }),
        ]);
        if (process.env.DEPLOY_ROLLBAR_SOURCEMAPS === 'true') {
            plugins = plugins.concat([
                new RollbarSourceMapPlugin({
                    accessToken: '32c39bfa4bb6440faedc1612a9c13d28',
                    version: GIT_SHA,
                    publicPath: 'https://0x.org/',
                }),
            ]);
        }
    }
    console.log('i ｢atl｣: Mode: ', config.mode);

    config.plugins = plugins;
    console.log('i ｢atl｣: Plugin Count: ', config.plugins.length);

    return config;
};
