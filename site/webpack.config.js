var webpack = require("webpack");
var path = require("path");
var production = process.env.NODE_ENV === 'production';

var plugins = [];

if (production) {
    plugins = plugins.concat([

        // This plugin looks for similar chunks and files
        // and merges them for better caching by the user
        new webpack.optimize.DedupePlugin(),

        // This plugins optimizes chunks and modules by
        // how much they are used in your app
        new webpack.optimize.OccurenceOrderPlugin(),

        // This plugin prevents Webpack from creating chunks
        // that would be too small to be worth loading separately
        new webpack.optimize.MinChunkSizePlugin({
            minChunkSize: 51200, // ~50kb
        }),

        // This plugin minifies all the Javascript code of the final bundle
        new webpack.optimize.UglifyJsPlugin({
            mangle:   true,
            compress: {
                warnings: false, // Suppress uglification warnings
            },
        }),

        // This plugins defines various variables that we can set to false
        // in production to avoid code related to them from being compiled
        // in our final bundle
        new webpack.DefinePlugin({
            __SERVER__:      !production,
            __DEVELOPMENT__: !production,
            __DEVTOOLS__:    !production,
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        })

    ]);
}

module.exports = {
    debug:   !production,
    devtool: production ? false : 'eval',
    entry: path.join(__dirname, "src", "app.js"),
    output: {
        path: path.join(__dirname, "built", "js"),
        filename: "bundle.js"
    },
    resolveLoader: {
        modulesDirectories: ['node_modules']
    },
    module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            query: {
              presets: ['es2015']
            }
          },
          { test: /\.scss$/, loaders: ["style", "css", "sass"] },
          { test: /\.mustache$/, loader: 'mustache'}
        ]
    },
    plugins: plugins
};
