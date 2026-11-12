(function () {
  'use strict';

  // NEWSの各項目を、文章の長さに応じて1行に収まる文字サイズへ個別に縮小する。
  // 短い項目はCSS指定の文字サイズのまま、長い項目だけ必要な分だけ縮む。
  // 読みやすさのため、MIN_FONT まで縮めても1行に収まらない項目は、元の文字サイズのまま2行に折り返す。
  var MIN_FONT = 11; // px。これより小さくはしない
  var STEP = 0.5;

  function fitItem(li) {
    var span = li.querySelector('span');
    if (!span) return;

    span.classList.remove('is-wrap');
    span.style.fontSize = '';
    var base = parseFloat(getComputedStyle(li).fontSize);
    var font = base;

    while (font > MIN_FONT && span.scrollWidth > span.clientWidth + 1) {
      font -= STEP;
      span.style.fontSize = font + 'px';
    }

    if (span.scrollWidth > span.clientWidth + 1) {
      span.style.fontSize = '';
      span.classList.add('is-wrap');
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
