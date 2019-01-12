'use strict';
var path = require('path');

var through = require('through2');
var deasync = require('deasync');
var browserify = require('browserify');
var browserifyInc = require('browserify-incremental')

var partialify = require('partialify/custom');
var cssy = require('./cssy');
var eslintify = require('./eslintify');
var shimixify = require('shimixify');
var derequire = require('derequire');

var babelify = require('./babelify');
var resolve = require('resolve-shimify');
var babelPlugins = require('./babel-plugins');
var collapser = require('bundle-collapser/plugin');
var commonShake = require('common-shakeify');

//Externalizes the source map found inside a stream to an external .map file or stream.
var mold = require('mold-source-map');
var BufferHelper = require('bufferhelper');

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

  var isDev = (process.env.NODE_ENV === 'development');

  var _ = fis.util;
  var project = fis.project;
  var currentMedia = project.currentMedia();
  var isDone = false;

  var id = _.md5(file.origin, 8);
  var cachePath = path.join(project.getCachePath('compile'), 'release-' + currentMedia);
  var cacheFile = path.join(cachePath, file.basename + id + '.json');

  if(!fis.util.exists(cacheFile)){
    fis.util.write(cacheFile, '');
  }

  var runtimePath = path.resolve(require.resolve('@babel/runtime/package.json'), '../../../');

  var documentRoot = fis.project.getProjectPath();

  var b = browserify({
    cache: {},
    debug: isDev,
    externalRequireName: externalRequireName,
    extensions: ['.js', '.es6', '.jsx'],
    fullPaths: fullPaths || (currentMedia === 'dev'),
    insertGlobalVars: insertGlobalVars,
    packageCache: {},
    paths: [ runtimePath ],
    transform: options.transform,
    ignoreTransform: options.ignoreTransform,
    standalone: standalone
  });

  browserifyInc(b, {
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
  //修改id减少包体积
  b.plugin(collapser);

  if(!isDev){
    b.plugin(commonShake);
  }

  b.plugin(resolve, function(module){
    return module.replace('$', documentRoot)
  });

  b.external(externals);

  b.pipeline.get('deps').on('data', function(obj) {
    file.cache.addDeps(obj.file);
  });

  if(options.eslint){
    b.transform(eslintify, {
      baseConfig: require('./eslintrc'),
      formatter: 'stylish', //codeframe,table,stylish
      continuous: true,
      useEslintrc: false
    });
  }

  // 编译 es6 &&  react
  b.transform(babelify, {
    presets: [
      [require('@babel/preset-env'), {
        targets: { chrome : '58', ie: '9', ios: '8', android: '4.1'},
        useBuiltIns: 'entry',
        configPath: runtimePath
      }],
      require('@babel/preset-react')
    ],
    plugins: babelPlugins,
    extensions: ['.es6', '.jsx', '.js'],
    babelrc: false,
    // global: true ,
    // ignore: ['node_modules/*'] ,
    // only: options.babelOnly
  });

  //编译css
  b.transform(cssy, { global: true });

  b.transform(shimixify.configure({ shims: shims }), { global: true });

  b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']));

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

  if(!isDev){
    content = derequire(content, [{
      from: 'require',
      to: '_dereq_'
    }, {
      from: 'define',
      to: '_defi_'
    }]);
  }


  return content;
}
