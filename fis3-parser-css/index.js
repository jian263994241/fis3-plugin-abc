var fs = require('fs');
var path = require('path');
var less = require('less');
var tpl = fs.readFileSync(path.join(__dirname, './template.tpl'), 'utf8');
var postcss = require('postcss');
var safe = require('postcss-safe-parser');
var sorting = require('postcss-sorting');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var deasync = require('deasync');
var modules = require('postcss-modules');

module.exports = function(content, file, conf) {

  if(/\.min\./.test(conf.filename)){
    return content;
  }

  var _ = fis.util;
  var documentRoot = fis.project.getProjectPath();

  var option = conf.option || {}

  var sourceMap = "",
    mapfile = fis.file(documentRoot, file.release + '.map');

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

  var isDone = false;

  var cssname = {};

  // if(!file.isCssLike){
  //   return fis.log.warn(conf.filename + ' is not css file.');
  // };

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
    autoprefixer({browsers: ['> 1%', 'iOS 7']}),
  ];

  if(file.rExt === '.js'){
    postcssPlus = postcssPlus.concat([
      cssnano({zIndex: false}),
      modules({
        getJSON: function(cssFileName, json) {
          cssname = json;
        }
      })
    ]);
  }

  postcss(postcssPlus).process(content, {
    parser: safe,
    from: file.origin,
    annotation: false,
    map: {
      prev: sourceMap,
      inline: false,
      sourcesContent: true,
      annotation: mapfile.basename
    }
  }).then(function(cssprocess){
    isDone = true;
    content =  cssprocess.css;
    sourceMap =  cssprocess.map;

    if(!file.isInline && file.useMap){
      mapfile.setContent(sourceMap);
      mapfile.save();
    }
  }).catch(function(){
    isDone = true;
  });

  deasync.loopWhile(function() {
    return !isDone;
  });

  if(file.rExt === '.js'){
    content = tpl.replace(/%compiled|%cssname/ig, function(matched){
      if(matched === '%compiled'){
        return JSON.stringify(content);
      }
      if(matched === '%cssname'){
        return JSON.stringify(cssname);
      }
    })
  }

  return content;
};
