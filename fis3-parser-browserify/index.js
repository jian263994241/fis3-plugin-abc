'use strict';
var path = require('path');
var through = require('through2');
var deasync = require('deasync');
var browserifyInc = require('./lib/incremental');
var cssy = require('./cssy');
var shimixify = require('shimixify');
var babelify = require('babelify');
var resolve = require('resolve-shimify');
var findNodeModules = require('find-node-modules');
// var eslintify = require('./eslintify');

//Externalizes the source map found inside a stream to an external .map file or stream.
var mold = require('mold-source-map');
var BufferHelper = require('bufferhelper');
var _ = fis.util;

module.exports = function(content, file, conf) {
  var options = conf.option || conf;
  var shims = options.shims || {}; // object
  var externals = options.externals || '';  //array || string
  var standalone = options.standalone || options.umd;  // string
  var expose = options.expose; // string
  var requires = options.requires; // array({path, expose})
  var insertGlobalVars = options.insertGlobalVars || {}; // {var: (file, basedir)=>var}
  var externalRequireName = options.externalRequireName || '$require';
  var fullPaths = options.fullPaths;
  var shortPath = options.shortPath || '~';

  var isDev = (process.env.NODE_ENV === 'development');

  var project = fis.project;
  var currentMedia = project.currentMedia();
  var isDone = false;

  var cacheFile = project.getCachePath('compile', 'release-' + currentMedia, file.filename + '.bs.json');

  if(!fis.util.exists(cacheFile)){
    fis.util.write(cacheFile, '');
  }

  var documentRoot = fis.project.getProjectPath();

  var b = browserifyInc({
    debug: isDev,
    externalRequireName: externalRequireName,
    extensions: ['.js', '.es6', '.jsx'],
    fullPaths: fullPaths || (currentMedia === 'dev'),
    insertGlobalVars: insertGlobalVars,
    paths: findNodeModules('@babel'),
    transform: options.transform,
    ignoreTransform: options.ignoreTransform,
    standalone: standalone,
    cacheFile: cacheFile
  });

  if (!expose) {
    b.add(file.realpath);
  } else {
    b.require(file.realpath, { expose: expose });
  }

  if (requires) {
    requires.forEach(function(r) {
      if (typeof r === 'string') {
        b.require(r);
      } else {
        b.require(r.path, {
          expose: r.expose
        });
      }
    });
  }

  b.external(externals);

  b.pipeline.get('deps').on('data', function(obj) {
    file.cache.addDeps(obj.file);
  });

  // if(options.eslint){
  //   b.transform(eslintify, {
  //     baseConfig: require('./eslintrc'),
  //     formatter: 'stylish', //codeframe,table,stylish
  //     continuous: true,
  //     useEslintrc: false
  //   });
  // }

  // 编译 es6 &&  react
  b.transform(babelify, {
    presets: [ require('babel-preset') ],
    extensions: ['.es6', '.jsx', '.js'],
    babelrc: false,
    ignore: ['node_modules']
  });

  //编译css
  b.transform(cssy, { global: true });

  b.transform(shimixify.configure({ shims: shims }), { global: true });

  b.plugin(resolve, module => module.replace(
    new RegExp(new RegExp('^\\' + shortPath +'(.+)')),
    ( target, subpath, index) => path.join(documentRoot, subpath)
  ));

  var bufferHelper = new BufferHelper();

  var stream = through(write, end);

  function write(chunk, enc, cb) {
    bufferHelper.concat(chunk);
    process.stdout.write('.');
    cb(null, chunk);
  }

  function end(done) {
    isDone = true;
    done();
  }

  function mapFileUrlComment(sourcemap, cb){

    if(!file.useMap) return cb();

    if(file.sourcemaps){
      file.sourcemaps.push(sourcemap.toJSON(2));
      cb('');
      return ;
    }

    var mapfile = fis.file.wrap(path.join(documentRoot, file.release + '.map'));
    mapfile.setContent(sourcemap.toJSON(2));
    mapfile.save()
    cb('//@ sourceMappingURL=' + mapfile.basename);
  }

  b.pipeline.get('deps').pipe(require('show-stream-progress')(process.stderr))

  b.bundle()
  .pipe(mold.transform(mapFileUrlComment))
  .pipe(stream)
  .on('error', function(err) {
    isDone = true;
    console.log(err.stack ? err.stack : err);
    fis.once('release:end', function() {
      _.del(file.cache.cacheInfo);
    });
  });

  // 使用 deasync 让 browserify 同步输出到 content
  deasync.loopWhile(function() {
    return !isDone;
  });

  content = bufferHelper.toBuffer().toString();

  return content;
}
