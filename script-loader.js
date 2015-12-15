/**
 * Created by Kuitos on 2014/05/29 13:29.
 * 脚本文件加载器
 * @author Kuitos lau
 * @tips 可配置 ScriptLoader.BASE_PATH 从而使用相对路径
 */
;
(function (window) {
  "use strict";

  // dynamically add base tag as well as css and javascript files.
  // we can't add css/js the usual way, because some browsers (FF) eagerly prefetch resources
  // before the base attribute is added, causing 404 and terribly slow loading of the docs app.
  function outerHTML(node) {
    // if IE, Chrome take the internal method otherwise build one
    return node.outerHTML || (function (n) {
        var div = document.createElement('div'), h;
        div.appendChild(n);
        h = div.innerHTML;
        div = null;
        return h;
      })(node);
  }

  function creteScriptDom(scriptSrc) {
    var scriptDom = document.createElement("script");
    // 如果以http://或https://开头，则使用原始路径
    scriptDom.src = ~scriptSrc.search(/^((http|https):\/\/)/g) ? scriptSrc : (ScriptLoader.BASE_PATH + scriptSrc);

    return scriptDom;
  }

  var headEl = document.getElementsByTagName('head')[0],
    loadedScripts = [],  // 已加载过的脚本缓存
    slice = Array.prototype.slice;

  var ScriptLoader = {

    BASE_PATH: "",

    /**
     * 同步方式加载script,这种方式加载多个脚本浏览器会并行下载(仅在IE下)且按标签顺序执行，但是会阻塞后续其他资源(即后面script标签里js代码的执行)
     * @warning 这种方式如果是在页面加载之后调用会重写整个文档流,请谨慎使用!!
     * @param arguments 同步加载脚本列表
     */
    loadSync: function () {

      var scriptList = slice.call(arguments);

      scriptList.forEach(function (scriptSrc) {

        // 当前脚本第一次加载
        if (!~loadedScripts.indexOf(scriptSrc)) {

          document.write(outerHTML(creteScriptDom(scriptSrc)));

          loadedScripts.push(scriptSrc);
        }

      });

      return ScriptLoader;
    },

    /**
     * 异步方式加载script,这种方式加载多个脚本浏览器会并行下载且一下载完成就执行（执行顺序依据下载完成时间，所以顺序不定），但是不会阻塞后续其他资源下载
     * innerHTML之类的方式只会往文档中插入节点,并不会触发浏览器解析script标签(下载并执行的能力)
     * @param scriptList 需要加载的文件列表
     * @param loadedCallback 脚本队列执行完之后执行的回调
     */
    loadAsync: function () {

      var counter = 0,
        scriptList = slice.call(arguments),
        loadedCallback = scriptList[scriptList.length - 1] || function noop() {
          },
        nonLoadScripts;

      if (typeof loadedCallback === 'function') {
        scriptList.pop();
      }

      nonLoadScripts = scriptList.filter(function (scriptSrc) {
        return !~loadedScripts.indexOf(scriptSrc);
      }); // 未加载过的脚本列表

      if (nonLoadScripts.length) {

        nonLoadScripts.forEach(function (scriptSrc) {

          var scriptDom;

          // 脚本第一次加载
          if (!~loadedScripts.indexOf(scriptSrc)) {

            counter++;

            scriptDom = creteScriptDom(scriptSrc);
            addCallbackWhenScriptLoaded(scriptDom, loadedCallback);
            headEl.appendChild(scriptDom);

            loadedScripts.push(scriptSrc);
          }
        });

      } else {
        loadedCallback();
      }

      return ScriptLoader;

      function addCallbackWhenScriptLoaded(scriptDom, func) {

        scriptDom.onloadDone = false;

        // 脚本执行完成之后执行的回调，onreadystatechange在IE中有效，onload在其他浏览器中有效
        scriptDom.onload = function () {
          // 当所有loaded的脚本加载完成之后执行回调函数
          if (!(--counter)) {
            func();
          }

          // helpful for gc
          scriptDom = null;
        };
        scriptDom.onreadystatechange = function () {

          if (("loaded" === scriptDom.readyState || "complete" === scriptDom.readyState) && !scriptDom.onloadDone) {
            scriptDom.onloadDone = true;
            scriptDom.onload();
          }
        };

      }
    },

    /**
     * 异步的方式加载脚本同时按顺序同步执行脚本
     */
    loadAsyncExecInOrder: function () {

      var scriptList = slice.call(arguments);

      function loadScript(scriptList) {

        var scriptSrc = scriptList.shift();

        if (typeof scriptList[0] === 'function') {
          ScriptLoader.loadAsync(scriptSrc, scriptList[0]);
        } else {
          ScriptLoader.loadAsync(scriptSrc, function () {
            loadScript(scriptList);
          });
        }

      }

      loadScript(scriptList);

      return ScriptLoader;

    },

    /**
     * 为最大提高网站加载速度，将不会立即用到的资源延时加载，避免跟需要立即执行的脚本抢占线程
     */
    loadScriptAsyncDelayed: function () {

      var args = slice.call(arguments);

      window.setTimeout(function () {
        ScriptLoader.loadScriptsAsync.apply(ScriptLoader, args);
      }, 500);
    }
  };

  window.ScriptLoader = ScriptLoader;

})(window);
