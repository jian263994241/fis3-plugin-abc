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

/*

调用
常量 B
fis.parser通道

option
{
externals (String||array)  外部文件,不打包
shims  (object)兼容 cnd 引入 变量
entry  (booleen)入口 默认 true

requires (array)打包依赖
}

*/

module.exports = function(content, file, conf) {

  var option = conf.option || {},
    defaultOpt = {
      shims: {},
      externals: '', //str or array
      expose: null,
      requires: null,
      umd: undefined,
      externalRequireName: 'require'
    },
    _ = fis.util,
    project = fis.project;


  option = Object.assign(defaultOpt, option || {});


  var _shimixify = shimixify.configure({ shims: option.shims }),
    _partialify = partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']),
    _bID = _.md5(file.origin, 8),
    currentMedia = project.currentMedia(),
    debug = Boolean(process.env.NODE_ENV === 'development'),
    cachePath = path.join(project.getCachePath('compile'), 'release-' + currentMedia),
    isDone = false;

  var cacheFile = path.join(cachePath, 'browserifyInc' + _bID + '.json');

  var bConfig = {
    debug: debug,
    extensions: ['.js', '.es6', '.jsx'],
    fullPaths: debug,
    cache: {},
    packageCache: {},
    paths: [path.resolve(__dirname, '../../node_modules'), './node_modules', './'],
    externalRequireName: option.externalRequireName
  };

  if (option.umd) {
    bConfig.standalone = option.umd;
  }

  var b = browserify(bConfig);

  browserifyInc(b, {
    cacheFile: cacheFile
  });

  if (!option.expose) {
    b.add(file.realpath);
  } else {
    b.require(file.realpath, {
      expose: option.expose
    });
  }

  if (option.requires) {
    option.requires.forEach(function(r) {
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

  b.external(option.externals);

  b.pipeline.get('deps')
    .on('data', function(obj) {
      if(!/node_modules/.test(obj.file) && /^\/.+/.test(obj.file)){
        file.cache.addDeps(obj.file);
      }
    });

  //编译css
  b.transform(cssy, {
    global: true
  });

  b.transform(_shimixify, {
    global: true
  });

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
      path.resolve(__dirname, './node_modules/babel-plugin-transform-decorators-legacy'),
      require('babel-plugin-transform-runtime'),
      require('babel-plugin-transform-object-assign')
    ],
    extensions: ['.es6', '.jsx', '.js']
  });


  b.transform(_partialify);

  var buffer = '';

  var stream = through2(write, end);

  function write(chunk, enc, next) {
    buffer += chunk.toString();
    process.stdout.write('.');
    next();
  }

  function end(done) {
    isDone = true;
    done();
  }

  b.bundle().on('error', function(err) {
    isDone = true;
    console.log(err.stack ? err.stack : err);
    fis.once('release:end', function() {
      _.del(file.cache.cacheInfo);
    });
  }).pipe(stream);

  // 使用 deasync 让 browserify 同步输出到 content
  deasync.loopWhile(function() {
    return !isDone;
  });

  content = derequire(buffer, [{
    from: 'require',
    to: '_dereq_'
  }, {
    from: 'define',
    to: '_defi_'
  }]);

  return content;
}
