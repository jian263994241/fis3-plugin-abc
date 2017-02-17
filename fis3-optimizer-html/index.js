const minify = require('html-minifier').minify;

module.exports = function(content, file, conf) {
  const option =  conf.option || {};
  return  minify(content, option);;
};
