
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

  var sourceMap = "",
    mapfile = fis.file.wrap(file.rest + '.css.map');

  var lessOptions = {
    paths: [file.dirname],
    filename: file.origin,
    sourceMap:{
      sourceMapFileInline: false,
      outputSourceFiles: true, // output less files in soucemap
      sourceMapRootpath: "file://"
    },
    syncImport: true,
    relativeUrls: true
  }


  if(!file.isCssLike){
    return fis.log.warn(conf.filename + ' is not css file.');
  };

  var isLessLike = /\.less$|\.lessm$/.test(conf.filename);

  if (isLessLike) {

    less.render(content, lessOptions, function(err, result) {
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
    autoprefixer({browsers: ['> 1%', 'iOS 7']})
  ];

  var cssprocess = postcss(postcssPlus).process(content, {
    parser: safe,
    from: file.origin,
    map: {
      prev: sourceMap,
      inline: false,
      sourcesContent: true,
      annotation: mapfile.basename
    }
  });

  content =  cssprocess.css;
  sourceMap =  cssprocess.map;

  if(!file.isInline){
    mapfile.setContent(sourceMap);
    mapfile.save();
  }

  return content;
};
