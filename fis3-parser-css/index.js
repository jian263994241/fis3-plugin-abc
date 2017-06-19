
var postcss = require('postcss');
var safe = require('postcss-safe-parser');
var sorting = require('postcss-sorting');
var autoprefixer = require('autoprefixer');
var fs = require('fs');
var path = require('path');
var less = require('less');


module.exports = function(content, file, conf) {

  if(/\.min\./.test(conf.filename)){
    return content;
  }

  var _ = fis.util;
  var documentRoot = fis.project.getProjectPath();

  var option = conf.option || {}

  var sourceMap = "", sourceFile = path.join(file.getDeploy() + '.map');

  var defaultOptions = {
    paths: [file.dirname],
    sourceMap:{
      // sourceMapBasepath: file.dirname,
      sourceMapRootpath: 'file://'
    },
    syncImport: true,
    // relativeUrls: true
  }

  option = _.assign(defaultOptions, option);

  if(!file.isCssLike){
    return fis.log.warn(conf.filename + ' is not css file.');
  };

  var isLessLike = /\.less$|\.lessm$/.test(conf.filename);



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
    parser: safe,
    from: file.release,
    map: {
      prev: sourceMap,
      inline: false,
      // sourcesContent: true,
      annotation: path.basename(sourceFile)
    }
  });

  content =  cssprocess.css;
  sourceMap =  cssprocess.map;

  if(!file.isInline){
    _.write(sourceFile, sourceMap);
  }

  return content;
};
