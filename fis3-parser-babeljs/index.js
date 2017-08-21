var babel = require("babel-core");
var env = require('babel-preset-env');
var react = require('babel-preset-react');
var stage0 = require('babel-preset-stage-0');

module.exports = function(content, file, conf) {
  if(!file.isJsLike) return content;

  var runtime = typeof conf.runtime === 'undefined' ? true : conf.runtime;

  var plugins = [
    require.resolve('babel-plugin-transform-decorators-legacy'),
    require.resolve('babel-plugin-transform-object-assign'),
    [require.resolve('babel-plugin-styled-components'), {
      displayName: false
    }]
  ];

  if(runtime){
    plugins.push(
      require.resolve('babel-plugin-transform-runtime')
    );
  }


  var options = {
    presets: [
      react,
      [env, {
        targets: {
          browsers: ["last 2 versions", "safari >= 7"]
        }
      }],
      stage0
    ],
    plugins: plugins
  }

  var result = babel.transform(content, options);

  file.sourceMap = result.map;

  content  = result.code;

  return content;
}
