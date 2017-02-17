
var postcss = require('postcss');
var safe = require('postcss-safe-parser');
var sorting = require('postcss-sorting');
var autoprefixer = require('autoprefixer');

var path = require('path');
var less = require('less');


module.exports = function(content, file, conf) {

  var _ = fis.util;

  var option = conf.option || {}

  var defaultOptions = {
    paths: [file.dirname, fis.project.getProjectPath()],
    sourceMap:{
      outputSourceFiles: true
    },
    syncImport: true,
    relativeUrls: true,
    autoprefixer: {
      browsers: ['> 1%', 'iOS 7']
    }
  }

  option = _.assign(defaultOptions, option);

  if(!file.isCssLike){
    return fis.log.warn(conf.filename + ' is not css file.');
  };

  var isLessLike = /\.less$|\.lessm$/.test(conf.filename);

  var sourceMap = {};

  if (isLessLike) {

    less.render(content, option, function(err, result) {
      if (err) {
        throw err;
      }
      content = result.css;
      sourceMap = result.map;

      result.imports.forEach(function(path) {
        file.cache.addDeps(path);
      });
    });

  };


  var postcssPlus = [
    sorting(),
    autoprefixer(option.autoprefixer)
  ];

  var cssprocess = postcss(postcssPlus).process(content, {
    parser: safe
  });

  content =  cssprocess.css;

  if(isLessLike){
    // data:application/json;base64,
    content = content + '/*# sourceMappingURL=data:application/json;base64,'+ _.base64(sourceMap) +' */';
  }

  return content;
};
