var path = require('path');
var fs = require('fs');
var url = require('url');
var httpProxy = require('http-proxy');
var dataFormat = require('./lib/dateFormat');
var devip = require('dev-ip');
var compress = require('compression');

var proxyConfig = require('./proxy.json');

var vconsolePath = require.resolve('eruda');
var vconsoleFile = fs.readFileSync(vconsolePath, 'utf8');


var args = process.argv.join('|');
var port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 8080;
var https = /\-\-https\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;
var DOCUMENT_ROOT = path.resolve(/\-\-root\|(.*?)(?:\||$)/.test(args) ? RegExp.$1 : process.cwd());
// var mlog = /\-\-mlog\|(true)(?:\||$)/.test(args) ? !!RegExp.$1 : false;


var proxy = httpProxy.createProxyServer({
  headers: {
    host: proxyConfig.host,
    origin: proxyConfig.origin
  }
});

function time() {
  return '[' + new Date().pattern("yyyy-MM-dd HH:mm:ss") + ']';
}

proxy.on('proxyReq', function(proxyReq, req, res, options) {
  console.log();
  console.log(time(), proxyReq.path);
  console.log(time(), 'RAW Request from the target', JSON.stringify(req.headers, true, 2));
  req.on('data', function(chunk) {
    console.log(time(), 'req: ' + chunk);
  });

});

proxy.on('proxyRes', function(proxyRes, req, res, options) {
  proxyRes.headers['Access-control-allow-origin'] = '*';
  proxyRes.headers['Access-Control-Allow-Headers'] = 'content-type,access-control-request-headers,accept,access-control-request-method,origin,authorization,x-requested-with';

  proxyRes.on('data', function(chunk) {
    console.log(time(), 'res: ' + chunk);
    console.log();
  });
});

// Bind to a port

var server = require('browser-sync').create();

var middleware = [],
  rewriteRules = [];

function proxyHandle(host, api) {
  return function(req, res, next) {
    setTimeout(function() {
      proxy.web(req, res, {
        target: url.resolve(host, api)
      });
    }, 500);
  }
}

proxy.on('error', function(err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('Something went wrong. And we are reporting a custom error message.');
});

var proxyLinks = proxyConfig.proxy;

proxyLinks.forEach(function(link, index) {
  middleware.push({
    route: link.api,
    handle: proxyHandle(link.host, link.api)
  });
});

//gzip
middleware.push(compress());

middleware.push({
  route: 'browser-sync',

})

// rewriteRules.push({
//   match: /127\.0\.0\.1/g,
//   fn: function(match, filename) {
//     var ip = devip();
//     if(ip.length>0){
//       ip = ip[0];
//     }else{
//       ip = '127.0.0.1';
//     }
//     return ip;
//   }
// });

rewriteRules.push({
  match: /<body>/,
  fn: function(match, ServerResponse) {
    return '<body>'+
      '<script id="__eruda_script__">' +
      'var script = document.createElement(\'script\'); script.src = \'/eruda/eruda.min.js?v=1.2.3\'; script.onload = function () { eruda.init() };' +
      'insertAfter(script, document.getElementById(\'__eruda_script__\'));' +
      'function insertAfter(el, referenceNode) { referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling); }' +
      '</script>';
  }
});

var css = DOCUMENT_ROOT + '/**.css';
var html = DOCUMENT_ROOT + '/**.html';
var js = DOCUMENT_ROOT + '/**.js';

server.watch([html, css, js], function(event, file) {
  if (event === "change" || event === "add") {
    server.reload(file);
  }
});


server.init({
  server: {
    baseDir: [
      DOCUMENT_ROOT,
      path.resolve(path.dirname(vconsolePath), '../')
    ],
    directory: true,
    middleware: middleware
  },
  port: port,
  open: false,
  notify: false,
  https: https,
  reloadDebounce: 300,
  injectChanges: true,
  ui: false,
  logPrefix: "cue",
  reloadOnRestart: true,
  rewriteRules: rewriteRules
}, function(e) {
  console.log(' Listening on ' + (https ? 'https' : 'http') + '://127.0.0.1:%d', port);
});



// console.log(server.instance.utils.devIp);
// 在接收到关闭信号的时候，关闭所有的 socket 连接。
(function() {
  // 关掉服务。
  process.on('SIGTERM', function() {
    console.log(' Recive quit signal in worker %s.', process.pid);
    server.exit();
  });
})(server);
