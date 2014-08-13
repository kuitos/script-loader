/**
 * Created by kui.liu on 2014/05/29 13:29.
 * 脚本文件加载器
 * @author kui.liu
 */

/**
 * @warning 重要： 使用之前必须设置window.ResourceDir
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

    var headEl = document.getElementsByTagName('head')[0],
        libRoot = window.ResourceDir + "js/",

        ScriptLoader = {

            /**
             * 同步方式加载script,这种方式加载多个脚本浏览器会并行下载且按标签顺序执行，但是会阻塞后续其他资源(即后面script标签里js代码的执行)
             * @param scriptList 同步加载脚本列表
             */
            addScriptsSync: function (scriptList) {

                scriptList.forEach(function (src) {

                    var scriptDom = document.createElement("script");
                    // 如果以http://或https://开头，则使用原始路径
                    scriptDom.src = ~src.search(/^((http|https):\/\/)/g) ? src : (libRoot + src);

                    document.write(outerHTML(scriptDom));

                });
            },

            /**
             * 异步方式加载script,这种方式加载多个脚本浏览器会并行下载且一下载完成就执行（执行顺序依据下载完成时间，所以顺序不定），但是不会阻塞后续其他资源下载
             * @param scriptList 需要加载的文件列表
             * @param loadedCallback 脚本队列执行完之后执行的回调
             */
            addScriptsAsync: function (scriptList, loadedCallback) {

                var length = scriptList.length;

                scriptList.forEach(function (src, index) {

                    var scriptDom = document.createElement("script");
                    // 如果以http://或https://开头，则使用原始路径
                    scriptDom.src = ~src.search(/^((http|https):\/\/)/g) ? src : (libRoot + src);

                    // 当最后一个脚本加载完成之后执行回调函数
                    if (index === length - 1 && loadedCallback && typeof loadedCallback === "function") {
                        scriptDom.onloadDone = false;

                        // 脚本执行完成之后执行的回调，onreadystatechange在IE中有效，onload在其他浏览器中有效
                        scriptDom.onload = function () {
                            loadedCallback();
                        };
                        scriptDom.onreadystatechange = function () {

                            if (("loaded" === scriptDom.readyState || "complete" === scriptDom.readyState) && !scriptDom.onloadDone) {
                                scriptDom.onloadDone = true;
                                scriptDom.onload();
                            }
                        };
                    }

                    headEl.appendChild(scriptDom);
                });
            },

            /**
             * 为最大提高网站加载速度，将不会立即用到的资源延时加载，避免跟需要立即执行的脚本抢占线程
             * @param scriptList
             * @param loadedCallback
             */
            addScriptAsyncDelayed: function (scriptList, loadedCallback) {

                window.setTimeout(function () {
                    ScriptLoader.addScriptsAsync(scriptList, loadedCallback);
                }, 1000);
            }
        };

    window.ScriptLoader = ScriptLoader;

})(window);
