/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2015-12-14
 */
;(function () {

  'use strict';


  var now = Date.now();

  while (Date.now() - now < 1500) {

  }
  console.log('index1');

  var div = document.createElement('div');
  div.textContent = 'index1';

  document.body.appendChild(div);

})();