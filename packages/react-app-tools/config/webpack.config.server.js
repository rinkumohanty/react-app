/**
 * Copyright © 2016-present Kriasoft. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

const nodeExternals = require('webpack-node-externals');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const paths = require('./paths');

module.exports = env => {
  const config = require('./webpack.config.' + env);
  return Object.assign({}, config, {
    name: 'server',
    target: 'node',
    node: false,

    entry: {
      app: paths.appNodeJs,
    },

    output: Object.assign({}, config.output, {
      path: paths.nodeBuild,
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    }),

    module: Object.assign({}, config.module, {
      rules: config.module.rules.map(x => {
        if (x.oneOf) {
          return Object.assign({}, x, {
            oneOf: x.oneOf.map(y => {
              if (y.use && y.use[0] === require.resolve('style-loader')) {
                return Object.assign({}, y, {
                  use: y.use.slice(1),
                });
              }
              return y;
            }),
          });
        }
        return x;
      }),
    }),

    // Remove plugins that are not needed in the server-side bundle
    plugins: config.plugins
      .filter(
        x =>
          !(x instanceof UglifyJsPlugin || x instanceof SWPrecacheWebpackPlugin)
      )
      .concat([
        new WriteFilePlugin({
          output: paths.nodeBuild,
          test: /^(.(?!hot-update))*$/,
        }),
      ]),

    externals: ['./assets.json', nodeExternals()],
  });
};
