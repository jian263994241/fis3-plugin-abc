'use strict';
var path = require('path');

var through2 = require('through2');
var deasync = require('deasync');
var browserify = require('browserify');
var browserifyInc = require('browserify-incremental')

var partialify = require('partialify/custom');
var cssy = require('./cssy');
var eslintify = require('eslintify');
var shimixify = require('shimixify');
var derequire = require('derequire');

var babelify = require('babelify');
var env = require('babel-preset-env');
var react = require('babel-preset-react');
var stage0 = require('babel-preset-stage-0');

var collapser = require('bundle-collapser/plugin');

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

  var _ = fis.util;
  var project = fis.project;
  var currentMedia = project.currentMedia();
  var debug = (process.env.NODE_ENV === 'development');
  var isDone = false;

  var id = _.md5(file.origin, 8);
  var cachePath = path.join(project.getCachePath('compile'), 'release-' + currentMedia);
  var cacheFile = path.join(cachePath, file.basename + id + '.json');

  var b = browserify({
    cache: {},
    debug: debug,
    externalRequireName: externalRequireName,
    extensions: ['.js', '.es6', '.jsx'],
    fullPaths: debug,
    insertGlobalVars: insertGlobalVars,
    packageCache: {},
    paths: [
      path.resolve(__dirname, '../../node_modules'),
      './node_modules',
      './'
    ],
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
  //增加banner

  b.external(externals);

  b.pipeline.get('deps').on('data', function(obj) {
    file.cache.addDeps(obj.file);
  });

  //编译css
  b.transform(cssy);

  b.transform(shimixify.configure({ shims: shims }), { global: true });

  b.transform(eslintify, {
    baseConfig: require('./eslintrc'),
    formatter: 'stylish', //codeframe,table,stylish
    continuous: true,
    useEslintrc: false
  });

  // 编译 es6 &&  react
  b.transform(babelify, {
    presets: [
      react,
      [env, {
        targets: {
          browsers: ["last 2 versions", "safari >= 7"]
        }
      }],
      stage0
    ],
    plugins: [
      require.resolve('babel-plugin-transform-decorators-legacy'),
      require.resolve('babel-plugin-transform-runtime'),
      require.resolve('babel-plugin-transform-object-assign')
    ],
    extensions: ['.es6', '.jsx', '.js']
  });


  b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']));

  var bufferHelper = new BufferHelper();

  var stream = through2(write, end);

  function write(chunk, enc, next) {
    bufferHelper.concat(chunk);
    process.stdout.write('.');
    next();
  }

  function end(done) {
    isDone = true;
    done();
  }

  function mapFileUrlComment(sourcemap, cb){

    if(!file.useMap) return cb();

    var documentRoot = fis.project.getProjectPath();
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

  content = derequire(content, [{
    from: 'require',
    to: '_dereq_'
  }, {
    from: 'define',
    to: '_defi_'
  }]);

  return content;
}
