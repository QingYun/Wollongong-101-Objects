var webpack = require("webpack");
var path = require("path");
var production = process.env.NODE_ENV === 'production';
var PersistentCacheWebpackPlugin = require('persistent-cache-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var plugins = [
  new PersistentCacheWebpackPlugin({
    file   : './webpack.cache.json',
    warn   : true,
    stats  : false,
    persist: true,
    ignore : []
  }),
  new ExtractTextPlugin("../stylesheets/style.css", {
    allChunks: true
  }),
  new webpack.IgnorePlugin(/unicode\/category\/So/, /slug$/)
];

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
            minChunkSize: 25600,
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
        filename: "bundle.js",
        publicPath: "/js/"
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
          { test: /\.json$/, loader: "json"},
          {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract("style-loader",
                                              "css-loader!sass-loader")
          },
          { test: /\.mustache$/, loader: path.join(__dirname, './mustache-loader.js')},
          { test: /\.svg$/, loader: 'url?limit=65000&mimetype=image/svg+xml' },
          { test: /\.woff$/, loader: 'url?limit=65000&mimetype=application/font-woff' },
          { test: /\.woff2$/, loader: 'url?limit=65000&mimetype=application/font-woff2' },
          { test: /\.[ot]tf$/, loader: 'url?limit=65000&mimetype=application/octet-stream' },
          { test: /\.eot$/, loader: 'url?limit=65000&mimetype=application/vnd.ms-fontobject' }
        ]
    },
    plugins: plugins
};
