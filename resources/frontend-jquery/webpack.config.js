
require('dotenv').config({ path: ["../.env", "../default.env"] })
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

const srcDir = path.resolve(__dirname, "src")
const distDir = path.resolve(__dirname, "dist")

module.exports = {
  entry: {
    index: path.resolve(srcDir, "index.ts"),
    auth: path.resolve(srcDir, "auth.ts")
  },
  output: {
    filename: "[name].js",
    path: distDir,
    clean: true // Optional, to clean the output directory before each build
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // Use ts-loader for .ts files
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              symbolId: 'icon-[name]'
            },
          },
        ],
      }
    ],
  },
  devServer: {
    static: {
      directory: distDir,
    },
    port: 9000,
    open: true,
    historyApiFallback: {
      rewrites: [
          { from: /^\/api\/.*$/, to: (context) => context.originalUrl },
          { from: /^\/auth$/, to: "/auth.html" },
          { from: /.*/, to: '/index.html' },
      ],
  }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      chunks: ["index"]
    }),
    new HtmlWebpackPlugin({
      template: 'src/auth.html',
      filename: "auth.html",
      chunks: ["auth"]
    }),
    new webpack.EnvironmentPlugin(['QLGP_REQUIRE_LOGIN', 'QLGP_USE_BACKEND']),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(srcDir, 'static'), to: path.resolve(distDir, 'static') }
      ]
    })
  ],
  mode: process.env.NODE_ENV == "development" ? "development" : "production",
}
