import path from "path";

import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import RobotstxtPlugin from "robotstxt-webpack-plugin";

const GLOBALS = {
  "process.env.NODE_ENV": JSON.stringify("production"),
  __DEV__: false,
};

export default {
  resolve: { extensions: ["*", ".js", ".jsx", ".json"] },
  entry: path.resolve(__dirname, "src/index"),
  target: "web",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "[name].[contenthash].js",
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "styles",
          test: /\.css$/,
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules|\.redux\.js$/,
        use: ["babel-loader"],
      },
      {
        test: /\.eot(\?v=\d+.\d+.\d+)?$/,
        use: [{ loader: "url-loader", options: { name: "[name].[ext]" } }],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [{ loader: "url-loader", options: { limit: 10000, mimetype: "application/font-woff", name: "[name].[ext]" } }],
      },
      {
        test: /\.[ot]tf(\?v=\d+.\d+.\d+)?$/,
        use: [{ loader: "url-loader", options: { limit: 10000, mimetype: "application/octet-stream", name: "[name].[ext]" } }],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [{ loader: "url-loader", options: { limit: 10000, mimetype: "image/svg+xml", name: "[name].[ext]" } }],
      },
      {
        test: /\.(jpe?g|png|gif|ico)$/,
        use: [{ loader: "file-loader", options: { name: "[name].[ext]" } }],
      },
      {
        test: /(\.css|\.scss|\.sass)$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: "css-loader" },
          { loader: "postcss-loader", options: { plugins: () => [require("cssnano"), require("autoprefixer")] } },
          { loader: "sass-loader", options: { includePaths: [path.resolve(__dirname, "src", "scss")] } },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin(GLOBALS),
    new RobotstxtPlugin(),
    new HtmlWebpackPlugin({
      template: "src/index.ejs",
      favicon: "src/favicon.ico",
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
      trackJSToken: "",
    }),
    new MiniCssExtractPlugin({ filename: "[name].[contenthash].css" }),
  ],
};
