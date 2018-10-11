const gulp = require('gulp');
const nodemon = require('nodemon');
const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const nodeExternals = require('webpack-node-externals');

const config = {
    target: 'node',
    entry: [path.join(__dirname, '/src/ts/server.ts')],
    output: {
        path: path.join(__dirname, '/server'),
        filename: 'server.js',
    },
    devtool: 'source-map',
    resolve: {
        modules: [path.join(__dirname, '/src/ts'), 'node_modules'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            ts: path.join(__dirname, '/src/ts'),
            contract_artifacts: path.join(__dirname, '/src/contract_artifacts'),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'source-map-loader',
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
            },
        ],
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: 'require("source-map-support").install();',
            raw: true,
            entryOnly: false,
        }),
    ],
    externals: nodeExternals({
        modulesDir: path.join(__dirname, '../../node_modules'),
    }),
    watchOptions: {
        ignored: /server|node_modules|transpiled/,
    },
};

gulp.task('build', function(done) {
    webpack(config).run(onBuild(done));
});

gulp.task('watch', function() {
    webpack(config).watch(100, function(err, stats) {
        onBuild()(err, stats);
        nodemon.restart();
    });
});

gulp.task('run', ['watch'], function() {
    nodemon({
        execMap: {
            js: 'node',
        },
        script: path.join(__dirname, 'server/server'),
        ignore: ['*'],
        watch: ['foo/'],
        ext: 'noop',
    }).on('restart', function() {
        console.log('Restarted!');
    });
});

function onBuild(done) {
    return function(err, stats) {
        if (err) {
            console.log('Error', err);
            process.exit(1);
        } else {
            console.log(stats.toString());
        }
        if (done) {
            if (stats.compilation.errors && stats.compilation.errors.length > 0) {
                process.exit(1);
            }
            done();
        }
    };
}
