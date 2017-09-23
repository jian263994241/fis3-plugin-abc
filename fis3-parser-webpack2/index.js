'use strict';
const path = require('path');

const webpack = require("webpack");
const env = require('babel-preset-env');
const react = require('babel-preset-react');
const stage0 = require('babel-preset-stage-0');
const deasync = require('deasync');
const MemoryFS = require("memory-fs");
const fs = new MemoryFS();

module.exports = function(content, file, conf) {

  const opts = {
    sourceMap: conf.sourceMap ? 'source-map': '',
    rules: conf.rules || [],
    plugins: conf.plugins || []
  }

  // opts.plugins.push(
  //   new UglifyJSPlugin()
  // );

  const compiler = webpack({
    entry: file.origin,
    output: {
      filename: file.id,
      libraryTarget: 'window',
      library: conf.umd
    },
    module:{
      rules: [
        {
          test: /\.(js|jsx|es6)$/,
          // exclude: /(node_modules|bower_components)/,
          enforce: 'pre',
          use: [{
            loader: 'babel-loader',
            options: {
              presets: [ [env, { targets: { browsers: ["last 2 versions", "safari >= 7"] } }], react, stage0 ],
              plugins: [
                require.resolve('babel-plugin-transform-decorators-legacy'),
                require.resolve('babel-plugin-transform-runtime'),
                require.resolve('babel-plugin-transform-object-assign'),
                [require.resolve('babel-plugin-styled-components'), { displayName: false }]
              ]
            },
          }]
        }
      ].concat(opts.rules)
    },
    externals: conf.externals,
    resolve: {
      alias:{
        'babel-runtime': path.dirname(require.resolve('babel-runtime/core-js'))
      },
      extensions: ['.js', '.json', '.jsx', '.css', '.less'],
      modules: [
        "node_modules"
      ],
    },
    devtool: opts.sourceMap,
    plugins: opts.plugins
  });

  compiler.outputFileSystem = fs;

  let isDone = false;

  compiler.run((err, stats) => {
    isDone = true;
    if (err) {
      fis.log.error(err.stack || err);
      if (err.details) {
        fis.log.error(err.details);
      }
      return;
    }
    // Done processing
    let info = stats.toString({colors: true});

    console.info(info);
    // Read the output later:

    content = fs.readFileSync(path.join(compiler.outputPath, file.id), 'utf8');

    if(opts.sourcemap){
      const soucemap = fs.readFileSync(path.join(compiler.outputPath, file.id + '.map'), 'utf8');
      file.sourcemaps.push(soucemap);
    }

  });

  // 使用 deasync 让 browserify 同步输出到 content
  deasync.loopWhile(function() {
    return !isDone;
  });

  return content;
}
