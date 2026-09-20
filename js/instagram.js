(function () {
  'use strict';

  var grid = document.getElementById('ig-grid');
  if (!grid) return;

  // data/instagram-posts.json の値は外部（Instagram）由来のため、
  // 想定した形式のURL・パスだけを受け付け、表示はDOM API（textContent等）で行う。
  var PERMALINK = /^https:\/\/www\.instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?(?:\?[^\s"'<>]*)?$/;
  var IMAGE = /^images\/instagram\/[A-Za-z0-9_-]+\.(?:jpg|png)$/;
  var MAX_POSTS = 3;

  function isValid(post) {
    return post && typeof post.permalink === 'string' && PERMALINK.test(post.permalink) &&
      typeof post.image === 'string' && IMAGE.test(post.image);
  }

  function buildCard(post) {
    var caption = typeof post.caption === 'string' ? post.caption : '';

    var link = document.createElement('a');
    link.className = 'ig-card';
    link.href = post.permalink;
    link.target = '_blank';
    link.rel = 'noopener';

    var img = document.createElement('img');
    img.src = post.image;
    img.alt = caption || 'Instagram post';
    img.loading = 'lazy';

    var overlay = document.createElement('span');
    overlay.className = 'ig-card-overlay';
    var captionEl = document.createElement('span');
    captionEl.className = 'ig-card-caption';
    captionEl.textContent = caption;
    overlay.appendChild(captionEl);

    link.appendChild(img);
    link.appendChild(overlay);
    return link;
  }

  fetch('data/instagram-posts.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.posts)) return;

      var valid = data.posts.filter(isValid);
      if (valid.length < data.posts.length) {
        console.warn('Instagram posts skipped (unexpected format):', data.posts.length - valid.length);
      }

      var fragment = document.createDocumentFragment();
      valid.slice(0, MAX_POSTS).forEach(function (post) {
        fragment.appendChild(buildCard(post));
      });
      grid.replaceChildren(fragment);
    })
    .catch(function (err) { console.error('Instagram posts load failed:', err); });
})();
