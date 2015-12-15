# script-loader
脚本加载器，包括同步、异步、延时等方式，支持promise

* script-loader 基于原生js的loader,无其他依赖
* script-loader-promise 基于es6 Promise的promise loader
* script-loader-angular 基于angular $q的promise loader

```js

ScriptLoader.loadAsync('index1.js', 'index2.js', function(){
    console.log('loaded');
});

```

install

```shell
npm install browser-script-loader --save
```
