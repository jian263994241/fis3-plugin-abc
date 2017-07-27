# fis3 css 优化插件

cue 的样式模块, 集成 postcss,less,safe-parser,sorting,autoprefixer

```javascript
fis.match('**.{less,css}',{
  parser: fis.plugin('css'),
  rExt: '.js' //如果配置为 '.js'  则已 css modules 方式编译成 js 
})

```
