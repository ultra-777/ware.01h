'use strict';
var path = require('path');
var extractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack');
var copyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
      'main': './temp/app/main.ts'
  },

  output: {
      path: path.join(process.cwd(), 'dist'),
      filename: 'application.js'
  },

  module: {
      rules: [
          {
              test: /\.ts$/,
              // use: ['awesome-typescript-loader?tsconfig=client/tsconfig.json', 'angular2-template-loader'],
              loaders: ['awesome-typescript-loader?configFileName=temp/tsconfig-aot.json', 'angular2-template-loader']
          },
          {
              test: /\.html$/,
              loaders: ['html-loader']
          },

          {
              test: /\.css$/,
              include: path.resolve(process.cwd(), 'src', 'app'),
              loaders: ['to-string-loader', 'css-loader']
          },
          {
              test: /\.css$/,
              exclude: path.resolve(process.cwd(), 'src', 'app'),
              loader: extractTextPlugin.extract({
                  fallbackLoader: 'style-loader',
                  loader: 'css-loader'
              })
          },
          {
              test: /\.scss$/,
              loader: extractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: ['css-loader', 'sass-loader'] })
          },
          {
              test: /\.less$/,
              loader: extractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: ['css-loader', 'less-loader'] })
          },
        /*
         { test: /\.(gif|png|jpe?g|svg)$/i, loader: "file-loader?&name=./imgs/[hash].[ext]" },

         { test: /\.gif$/, loader: "url-loader?mimetype=image/gif" }

         {
         test: /.*\.(gif|png|jpe?g|svg)$/i,
         loaders: [
         'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
         'image-webpack'
         ]
         }
         */
      ]
  },

  plugins: [
      new webpack.ProgressPlugin(),
      new webpack.ContextReplacementPlugin(
          // The (\\|\/) piece accounts for path separators in *nix and Windows
          /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
          path.join(process.cwd(), 'src')
      ),
      new copyWebpackPlugin([
          { from: 'client/index.html' },
          { from: 'client/favicon.ico' }
      ]),
      new extractTextPlugin('application.css'),
      new webpack.optimize.UglifyJsPlugin({
          beautify: false,
          comments: false,
          compress: {
              warnings: false
          },
          output: {
              comments: false
          },
          sourceMap: true,
          mangle: true
      }),
  ],

  resolve: {
      modules: [
          'node_modules',
          path.resolve(process.cwd(), 'src')
      ],
      extensions: ['.ts', '.js']
  },

  devServer: {
      contentBase: './src',
      port: 9000,
      inline: true,
      historyApiFallback: true,
      stats: 'errors-only',
      watchOptions: {
          aggregateTimeout: 300,
          poll: 500
      }
  },

  stats: 'errors-only',

  devtool: 'source-map'
};
