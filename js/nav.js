(function () {
  'use strict';

  var navToggle = document.getElementById('nav-toggle');
  if (!navToggle) return;

  document.querySelectorAll('.nav-mobile-panel a').forEach(function (a) {
    a.addEventListener('click', function () { navToggle.checked = false; });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) navToggle.checked = false;
  });
})();
