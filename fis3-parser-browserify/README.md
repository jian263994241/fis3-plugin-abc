# fis3 编译插件 .

集成

- browserify
- browserify-incremental
- partialify
- eslintify
- shimixify
- bundle-collapser

- babelify
- babel-preset-es2015
- babel-preset-react
- babel-preset-stage-1
- babel-plugin-transform-regenerator
- babel-plugin-transform-runtime
- babel-plugin-transform-object-assign
- babel-plugin-transform-function-bind

编译 es2015, react , 支持 babel stage-1 环境


```javascript

//development 环境 debug：true
fis.once('compile:start', function(file) {
  if (fis.project.currentMedia() != "dev") {
    process.env.NODE_ENV = 'production';
  }else{
    process.env.NODE_ENV = 'development';
  }
});


//fis-conf.js

fis.match('app.js',{
  parser: fis.plugin('browserify',{
    option:{
      shims:{
        'react':'global.React',
        'react-dom' :'global.ReactDOM',
        'react-router': 'global.ReactRouter',
        'antd': 'global.antd'
      }
    }
  })
});


```
