/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2015-09-14
 */
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
     * 同步方式加载script,这种方式加载多个脚本浏览器会并行下载且按标签顺序执行，但是会阻塞后续其他资源(即后面script标签里js代码的执行)
     * @param scriptList 同步加载脚本列表
     */
    loadScriptsSync: function (scriptList) {

      scriptList.forEach(function (scriptSrc) {

        // 当前脚本第一次加载
        if (!~loadedScripts.indexOf(scriptSrc)) {

          document.write(outerHTML(creteScriptDom(scriptSrc)));

          loadedScripts.push(scriptSrc);
        }

      });
    },

    /**
     * 异步方式加载script,这种方式加载多个脚本浏览器会并行下载且一下载完成就执行（执行顺序依据下载完成时间，所以顺序不定），但是不会阻塞后续其他资源下载
     * @param scriptList 需要加载的文件列表
     * @param loadedCallback 脚本队列执行完之后执行的回调
     */
    loadScriptsAsync: function (scriptList, loadedCallback) {

      var scriptList = slice.call(arguments),
        loadedCallback = scriptList[scriptList.length - 1];

      if (typeof loadedCallback === 'function') {
        scriptList.pop();
      }

      function addCallbackWhenScriptLoaded(script, resolve) {

        script.onloadDone = false;

        // 脚本执行完成之后执行的回调，onreadystatechange在IE中有效，onload在其他浏览器中有效
        script.onload = function () {
          resolve();
          // helpful for gc
          script = null;
        };
        script.onreadystatechange = function () {

          if (("loaded" === script.readyState || "complete" === script.readyState) && !script.onloadDone) {
            script.onloadDone = true;
            script.onload();
          }
        };

      }

      var promises = scriptList.map(function (scriptSrc) {

        return new Promise(function (resolve) {

          var scriptDom;

          // 脚本第一次加载
          if (!~loadedScripts.indexOf(scriptSrc)) {

            scriptDom = creteScriptDom(scriptSrc);
            addCallbackWhenScriptLoaded(scriptDom, resolve);
            headEl.appendChild(scriptDom);

            loadedScripts.push(scriptSrc);

          } else {
            resolve();
          }

        });

      });

      return Promise.all(promises).then(loadedCallback || function noop(promises) { return promises });

    },

    /**
     * 为最大提高网站加载速度，将不会立即用到的资源延时加载，避免跟需要立即执行的脚本抢占线程
     * @param scriptList
     * @param loadedCallback
     */
    loadScriptAsyncDelayed: function (scriptList, loadedCallback) {

      var args = slice.call(arguments);

      return new Promise(function (resolve) {

        window.setTimeout(function () {
          resolve(ScriptLoader.loadScriptsAsync.apply(ScriptLoader, args));
        }, 500);
      });
    }
  };

  window.ScriptLoader = ScriptLoader;

})(window);
