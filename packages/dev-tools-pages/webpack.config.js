const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const pages = require('./pages');

const config = {
    entry: {
        compiler: './ts/pages/compiler.tsx',
        coverage: './ts/pages/coverage.tsx',
        profiler: './ts/pages/profiler.tsx',
        trace: './ts/pages/trace.tsx',
    },
    node: {
        fs: 'empty',
    },
    output: {
        path: path.join(__dirname, '/public'),
        filename: 'bundle-[name].js',
        chunkFilename: 'bundle-[name].js',
        publicPath: '/',
    },
    devtool: 'source-map',
    resolve: {
        modules: [path.join(__dirname, '/ts'), 'node_modules'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            ts: path.join(__dirname, '/ts'),
            less: path.join(__dirname, '/less'),
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
                loaders: ['react-svg-loader'],
            },
        ],
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
            }),
        ],
    },
    devServer: {
        port: 3572,
        disableHostCheck: true,
        overlay: true,
        historyApiFallback: true,
    },
};

module.exports = (_env, argv) => {
    let plugins = [
        new CleanWebpackPlugin('public'),
        ...pages.map(p => {
            p.environment = argv.mode;
            return new HtmlWebpackPlugin(p);
        }),
        new CopyWebpackPlugin([
            { from: 'assets/crawl.html', to: 'index.html' },
            { from: 'assets/fonts', to: 'fonts' },
            { from: 'assets/images', to: 'images' },
        ]),
    ];
    if (argv.mode === 'development') {
        config.mode = 'development';
    } else {
        config.mode = 'production';
        config.output.filename = 'bundle-[name].[chunkhash].js';
        config.output.chunkFilename = 'bundle-[name].[chunkhash].js';

        plugins = plugins.concat([
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV || config.mode),
                },
            }),
            // commented out to check the bundle when needed
            //new BundleAnalyzerPlugin(),
        ]);
    }
    console.log('i ｢atl｣: Mode: ', config.mode);

    config.plugins = plugins;
    console.log('i ｢atl｣: Plugin Count: ', config.plugins.length);

    return config;
};
