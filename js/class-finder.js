(function () {
  'use strict';

  // クラス診断チャット（トップページ）
  // 質問・結果の文章は data/class-finder.json にあります。文章の修正はそちらだけで済みます。

  var DATA_URL = 'data/class-finder.json';

  // 時間割の講師名 → 講師ページ
  var INSTRUCTORS = {
    'SEUN': 'seun', 'REMI': 'remi', 'yuko': 'yuko', 'YUKi': 'yuki', 'HAYATARO': 'hayataro',
    'konomi': 'konomi', 'syoui': 'syoui', 'Remon': 'remon', 'Nönöka': 'nonoka', 'TAICHI': 'taichi',
    'KUMA': 'kuma', 'TOGASHI': 'togashi', 'Rina': 'rina', 'はっぴーがーる': 'happygirl',
    'LIN': 'lin', 'Yamakazu': 'yamakazu', 'SE1TAROW': 'se1tarow'
  };

  var NAME_RE = new RegExp('(' + Object.keys(INSTRUCTORS)
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); })
    .join('|') + ')');

  var dialog = document.getElementById('cf-dialog');
  if (!dialog) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bodyEl = document.getElementById('cf-body');
  var logEl = document.getElementById('cf-log');
  var toolsEl = document.getElementById('cf-tools');
  var backBtn = document.getElementById('cf-back');
  var resetBtn = document.getElementById('cf-reset');
  var closeBtn = document.getElementById('cf-close');
  var fab = document.querySelector('.cf-fab');

  var data = null;
  var stack = []; // [{qid, idx}]
  var lastTrigger = null;
  var isProd = /(^|\.)nalstudio-tokyo\.com$/.test(location.hostname);

  // Google Analytics 4 へイベントを送る（本番サイトでのみ送信。ローカル確認では送らない）
  function gtag() { window.dataLayer.push(arguments); }
  function track(name, params) {
    if (!isProd || !window.dataLayer) return;
    gtag('event', name, params || {});
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function lineUrl(message) {
    return 'https://line.me/R/oaMessage/' + data.lineId + '/?' + encodeURIComponent(message);
  }

  // 文章中の講師名を、講師ページへのリンクにする
  function appendLinked(parent, text) {
    text.split(NAME_RE).forEach(function (part) {
      if (INSTRUCTORS[part]) {
        var a = el('a', 'cf-who', part);
        a.href = 'instructor_' + INSTRUCTORS[part] + '.html';
        a.target = '_blank';
        a.rel = 'noopener';
        parent.appendChild(a);
      } else if (part) {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function bubble(who) {
    var row = el('div', 'cf-row cf-' + who);
    var b = el('div', 'cf-bubble');
    row.appendChild(b);
    logEl.appendChild(row);
    return b;
  }

  function addQuestion(qid, answeredIdx) {
    var q = data.questions[qid];
    var b = bubble('bot');
    b.appendChild(el('p', 'cf-q', q.text));

    var grid = el('div', 'cf-options');
    q.options.forEach(function (opt, i) {
      var btn = el('button', 'cf-opt');
      btn.type = 'button';
      btn.appendChild(el('span', 'cf-opt-label', opt.label));
      btn.appendChild(el('span', 'cf-opt-sub', opt.sub));
      if (answeredIdx !== undefined) {
        btn.disabled = true;
        if (i === answeredIdx) btn.classList.add('cf-chosen');
      } else {
        btn.addEventListener('click', function () { choose(qid, i); });
      }
      grid.appendChild(btn);
    });
    b.appendChild(grid);
    return grid;
  }

  function addUser(text) {
    bubble('user').textContent = text;
  }

  function addSections(parent, sections) {
    (sections || []).forEach(function (s) {
      var box = el('div', 'cf-sec');
      var h = el('div', 'cf-sec-head');
      h.appendChild(el('span', 'cf-chip'));
      h.appendChild(el('span', 'cf-sec-title', s.heading));
      if (s.note) h.appendChild(el('span', 'cf-sec-note', s.note));
      box.appendChild(h);
      var ul = el('ul', 'cf-lines');
      s.lines.forEach(function (line) {
        var li = el('li');
        appendLinked(li, line);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      parent.appendChild(box);
    });
  }

  function addCtas(parent, ctas, resultId) {
    var wrap = el('div', 'cf-ctas');
    ctas.forEach(function (c) {
      var a = el('a', 'cf-cta' + (c.type === 'page' ? ' cf-cta-sub' : ''), c.label);
      if (c.type === 'line') {
        a.href = lineUrl(c.message);
        a.target = '_blank';
        a.rel = 'noopener';
      } else if (c.type === 'link') {
        a.href = data.links[c.linkKey];
        a.target = '_blank';
        a.rel = 'noopener';
      } else {
        // ページ内リンク（診断を閉じて、その場所へ移動）
        a.href = c.url;
        a.addEventListener('click', closeDialog);
      }
      a.addEventListener('click', function () {
        track('class_finder_cta', { result: resultId, label: c.label });
      });
      wrap.appendChild(a);
    });
    parent.appendChild(wrap);
  }

  function addResult(rid) {
    var r = data.results[rid];
    var b = bubble('bot');
    b.classList.add('cf-result');

    b.appendChild(el('p', 'cf-q', 'あなたにおすすめ'));
    var title = el('h3', 'cf-result-title', r.title);
    title.tabIndex = -1;
    title.id = 'cf-result-title';
    b.appendChild(title);
    if (r.lead) b.appendChild(el('p', 'cf-lead', r.lead));

    addSections(b, r.sections);
    if (r.footnote) b.appendChild(el('p', 'cf-foot', r.footnote));
    addCtas(b, r.ctas, rid);
    if (r.ctaNote) b.appendChild(el('p', 'cf-ctanote', r.ctaNote));

    if (r.extra) {
      var ex = el('div', 'cf-extra');
      ex.appendChild(el('h4', 'cf-extra-title', r.extra.title));
      addSections(ex, r.extra.sections);
      addCtas(ex, r.extra.ctas, rid + ':extra');
      b.appendChild(ex);
    }
  }

  function choose(qid, idx) {
    var opt = data.questions[qid].options[idx];
    track('class_finder_answer', { question: qid, answer: opt.label });
    stack.push({ qid: qid, idx: idx });
    render(true);
    if (opt.result) track('class_finder_result', { result: opt.result });
  }

  function render(scroll) {
    logEl.textContent = '';
    var qid = data.start;
    var resultId = null;

    for (var i = 0; i < stack.length; i++) {
      var step = stack[i];
      var opt = data.questions[step.qid].options[step.idx];
      addQuestion(step.qid, step.idx);
      addUser(opt.label + (opt.sub ? '（' + opt.sub + '）' : ''));
      if (opt.result) { resultId = opt.result; } else { qid = opt.next; }
    }

    var focusTarget;
    if (resultId) {
      addResult(resultId);
      focusTarget = document.getElementById('cf-result-title');
    } else {
      focusTarget = addQuestion(qid).querySelector('button');
    }

    toolsEl.hidden = stack.length === 0;

    if (scroll && stack.length) {
      var last = logEl.lastElementChild;
      if (last) last.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    } else {
      bodyEl.scrollTop = 0;
    }
  }

  function showError() {
    logEl.textContent = '';
    var b = bubble('bot');
    b.appendChild(el('p', 'cf-q', '診断を読み込めませんでした。お手数ですが、公式LINEからご相談ください。'));
    var a = el('a', 'cf-cta', '公式LINEを開く');
    a.href = 'https://line.me/R/ti/p/@nalstudio_tokyo';
    a.target = '_blank';
    a.rel = 'noopener';
    b.appendChild(a);
  }

  function load() {
    fetch(DATA_URL)
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (json) { data = json; render(false); })
      .catch(showError);
  }

  // 閉じたあとの後始末（ESCキーなどで閉じた場合は close イベントからも呼ばれる）
  function cleanup() {
    document.documentElement.classList.remove("cf-lock");
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
    cleanup();
  }

  function openDialog(trigger) {
    lastTrigger = trigger || null;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.documentElement.classList.add('cf-lock');
    track('class_finder_open', { source: (trigger && trigger.getAttribute('data-cf-open')) || '' });
    if (!data) load();
  }

  document.querySelectorAll('[data-cf-open]').forEach(function (btn) {
    btn.addEventListener('click', function () { openDialog(btn); });
  });

  closeBtn.addEventListener('click', closeDialog);

  // 枠の外（暗い部分）をクリックして閉じる
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeDialog();
  });

  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('cf-lock');
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
  });

  backBtn.addEventListener('click', function () {
    stack.pop();
    render(true);
  });
  resetBtn.addEventListener('click', function () {
    stack = [];
    render(false);
  });

  // 右下のボタン：ヒーローを過ぎてから表示する。ページ内の大きな入口が見えている間は隠す
  if (fab) {
    var hero = document.querySelector('.diagnose-hero');
    var update = function () {
      var heroInView = false;
      if (hero) {
        var r = hero.getBoundingClientRect();
        heroInView = r.bottom > 0 && r.top < window.innerHeight;
      }
      fab.classList.toggle('is-visible', window.scrollY > 480 && !heroInView);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
