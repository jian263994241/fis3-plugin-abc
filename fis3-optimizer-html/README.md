
[html-minifier](https://www.npmjs.com/package/html-minifier)的fis3 optimizer 插件

```javascript

fis.match('third/**', {
  optimizer: fis.plugin('html',{
    option: {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
      removeComments: true
      // .... 配置
    }
  });
});


```


Options Quick Reference : [html-minifier](https://www.npmjs.com/package/html-minifier)
