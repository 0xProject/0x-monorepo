const path = require('path');
const webpack = require('webpack');

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
                ],
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader'],
            },
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
            {
                test: /\.md$/,
                use: 'raw-loader',
            },
        ],
    },
    devServer: {
        port: 3000,
        disableHostCheck: true,
        historyApiFallback: {
            // Fixes issue where having dots in URL path that aren't part of fileNames causes webpack-dev-server
            // to fail.
            // Source: https://github.com/cvut/fittable/issues/171
            rewrites: [
                {
                    from: /.*$/,
                    to: function() {
                        return 'index.html';
                    },
                },
            ],
        },
        contentBase: path.join(__dirname, '/public'),
    },
    plugins:
        process.env.NODE_ENV === 'production'
            ? [
                  new webpack.DefinePlugin({
                      'process.env': {
                          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                      },
                  }),
              ]
            : [],
};
