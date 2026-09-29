(function () {
  'use strict';

  // NEWSの各項目を、文章の長さに応じて1行に収まる文字サイズへ個別に縮小する。
  // 短い項目はCSS指定の文字サイズのまま、長い項目だけ必要な分だけ縮む。
  var MIN_FONT = 9; // px。これより小さくはしない（読みにくくなるため、末尾は省略記号で表示）
  var STEP = 0.5;

  function fitItem(li) {
    var span = li.querySelector('span');
    if (!span) return;

    span.style.fontSize = '';
    var font = parseFloat(getComputedStyle(li).fontSize);

    while (font > MIN_FONT && span.scrollWidth > span.clientWidth + 1) {
      font -= STEP;
      span.style.fontSize = font + 'px';
    }
  }

  function fitAll() {
    document.querySelectorAll('.news-list li').forEach(fitItem);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fitAll);
  } else {
    fitAll();
  }
  window.addEventListener('load', fitAll); // Webフォント読み込み後に再計測

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitAll, 150);
  });
})();
