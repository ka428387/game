// めいろ4つ（もり・うみ・まち・うちゅう）共通の骨組み。
// 画面の並び・むずかしさ・やじるし・スワイプ・キーボード・ヒント・おんがく・ゴール画面をここで1つにする。
// 各めいろは「めいろを作って描く」「1マス動く」だけを受けもつ。
//
// ページの書き方：
//   <main class="mz" id="mz"><div class="mz-board"><canvas id="maze"></canvas></div></main>
//   MazeUI.mount({
//     title: '🌲 もりのめいろ 🌲',
//     onNew(level)  … level は 0/1/2。めいろを作り直して描く（MazeUI.SIZES[level] マスの正方形）
//     onMove(dx, dy) … 1マス動く。動けたら true
//     onHint(on)    … ヒント（ゴールまでの道）を出す／消す
//     onResize()    … 画面の大きさが変わった。MazeUI.boardSize() で描き直す
//     music: { start(), stop() },
//     clear: { emoji: '🐿️', text: 'おうちに ついたよ！' },
//   });
//   ゴールしたら MazeUI.win({ extra: '⭐ あつめたほし：3/3' })
(function () {
  'use strict';

  var LEVEL_NAMES = ['かんたん', 'ふつう', 'むずかしい'];
  // むずかしさごとの、よこ・たての部屋の数（どのめいろも同じ）
  var SIZES = [6, 9, 12];

  var cfg = null;
  var st = { level: 0, won: false, hint: false, music: false, steps: 0, extra: '' };
  var el = {};

  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function button(cls, text, onTap) {
    var b = make('button', cls, text);
    b.type = 'button';
    b.addEventListener('click', onTap);
    return b;
  }

  function renderInfo() {
    el.info.textContent = '';
    el.info.appendChild(make('span', '', '👣 あるいたマス：' + st.steps));
    if (st.extra) el.info.appendChild(make('span', '', st.extra));
  }
  function setLevelButtons() {
    el.levels.forEach(function (b, i) { b.classList.toggle('on', i === st.level); });
  }
  function setHint(on) {
    st.hint = on;
    el.hintBtn.classList.toggle('on', on); // ついているときは色がつく
        if (cfg.onHint) cfg.onHint(on);
  }
  function setMusic(on) {
    st.music = on;
    el.musicBtn.classList.toggle('on', on);
        if (!cfg.music) return;
    if (on) cfg.music.start(); else cfg.music.stop();
  }

  function newGame() {
    st.won = false;
    st.steps = 0;
    el.clear.classList.remove('show');
    setLevelButtons();
    cfg.onNew(st.level);
    setHint(false);
    renderInfo();
  }

  function move(dx, dy) {
    if (st.won) return;
    cfg.onMove(dx, dy);
  }

  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right'
  };

  function mount(c) {
    cfg = c;
    var root = document.getElementById('mz');
    var board = root.querySelector('.mz-board');

    el.title = make('h1', 'mz-title', c.title);

    var levelRow = make('div', 'mz-row mz-levels');
    el.levels = LEVEL_NAMES.map(function (name, i) {
      var b = button('mz-btn', name, function () { st.level = i; newGame(); });
      levelRow.appendChild(b);
      return b;
    });

    var tools = make('div', 'mz-row mz-tools');
    tools.appendChild(button('mz-btn', '🔄 あたらしく', newGame));
    el.hintBtn = button('mz-btn', '💡 ヒント', function () { setHint(!st.hint); });
    el.musicBtn = button('mz-btn', '🎵 おんがく', function () { setMusic(!st.music); });
    tools.appendChild(el.hintBtn);
    tools.appendChild(el.musicBtn);

    el.info = make('div', 'mz-info');

    root.insertBefore(el.title, board);
    root.insertBefore(levelRow, board);
    root.insertBefore(tools, board);
    root.insertBefore(el.info, board);

    // やじるし（押した瞬間に動く。マウスでも指でも1回だけ）
    var pad = make('div', 'mz-pad');
    [['up', '▲'], ['left', '◀'], ['right', '▶'], ['down', '▼']].forEach(function (p) {
      var b = make('button', p[0], p[1]);
      b.type = 'button';
      b.setAttribute('aria-label', { up: 'うえ', left: 'ひだり', right: 'みぎ', down: 'した' }[p[0]]);
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        b.classList.add('pressed');
        setTimeout(function () { b.classList.remove('pressed'); }, 120);
        move(DIRS[p[0]][0], DIRS[p[0]][1]);
      });
      pad.appendChild(b);
    });
    root.appendChild(pad);
    el.pad = pad;
    root.appendChild(make('div', 'mz-swipe', '📱 めいろを スワイプしても うごかせるよ'));

    // ゴール画面
    el.clear = make('div', 'mz-clear');
    var card = make('div', 'mz-card');
    var em = make('div', 'em');
    if (c.clear.img) { var im = make('img'); im.src = c.clear.img; im.alt = ''; em.appendChild(im); }
    else em.textContent = c.clear.emoji;
    card.appendChild(em);
    card.appendChild(make('h2', '', '🎉 ゴール！'));
    card.appendChild(make('p', '', c.clear.text));
    el.clearSteps = make('p', '');
    el.clearExtra = make('p', '');
    card.appendChild(el.clearSteps);
    card.appendChild(el.clearExtra);
    var row = make('div', 'row');
    row.appendChild(button('again', 'もういちど あそぶ', newGame));
    row.appendChild(button('change', 'むずかしさを かえる', function () {
      el.clear.classList.remove('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    card.appendChild(row);
    el.clear.appendChild(card);
    document.body.appendChild(el.clear);

    // キーボード
    document.addEventListener('keydown', function (e) {
      var d = KEYS[e.key];
      if (!d) return;
      e.preventDefault();
      move(DIRS[d][0], DIRS[d][1]);
    });

    // めいろの上でスワイプ
    var sx = 0, sy = 0, tracking = false;
    board.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    board.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (!tracking) return;
      var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      tracking = false; // 1回のスワイプで1マス
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
      else move(0, dy > 0 ? 1 : -1);
    }, { passive: false });
    board.addEventListener('touchend', function () { tracking = false; }, { passive: true });

    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (cfg.onResize) cfg.onResize(); }, 100);
    });

    newGame();
  }

  // めいろを描ける大きさ（正方形の1辺 px）。下に やじるしが入るように高さも見る
  function boardSize() {
    var board = document.querySelector('#mz .mz-board');
    var top = board.getBoundingClientRect().top + window.scrollY;
    var below = (el.pad ? el.pad.offsetHeight : 192) + 12 + 30 + 8 + 14; // やじるし＋余白＋スワイプの一言＋ふち
    var byH = window.innerHeight - top - below;
    var byW = Math.min(window.innerWidth - 24 - 8, 560);
    return Math.floor(Math.max(220, Math.min(byW, byH)));
  }

  // ── おんがく：音の高さ（MIDI番号）と長さ（拍）の並びを、くり返し鳴らす ──
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function makeMusic(spec) {
    var ctx = null, timer = null, nextT = 0, idx = [0, 0], master = null;
    var beat = 60 / spec.bpm;
    var parts = [spec.melody, spec.bass];
    var times = [0, 0];
    function note(m, t, dur, type, vol) {
      if (m == null) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = midi(m);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.15, dur * 0.95));
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function schedule() {
      var horizon = ctx.currentTime + 0.4;
      parts.forEach(function (seq, p) {
        while (times[p] < horizon) {
          var n = seq[idx[p] % seq.length];
          var dur = n[1] * beat;
          note(n[0], times[p], dur, p === 0 ? spec.wave : 'sine', p === 0 ? spec.vol : spec.vol * 0.8);
          times[p] += dur; idx[p]++;
        }
      });
    }
    return {
      start: function () {
        if (!ctx) ctx = new window.AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
        idx = [0, 0];
        times = [ctx.currentTime + 0.05, ctx.currentTime + 0.05];
        schedule();
        timer = setInterval(schedule, 150);
      },
      stop: function () {
        clearInterval(timer); timer = null;
        if (master) { try { master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); } catch (e) {} }
      }
    };
  }

  window.MazeUI = {
    SIZES: SIZES,
    mount: mount,
    boardSize: boardSize,
    level: function () { return st.level; },
    hintOn: function () { return st.hint; },
    isWon: function () { return st.won; },
    setSteps: function (n) { st.steps = n; renderInfo(); },
    setExtra: function (text) { st.extra = text || ''; renderInfo(); },
    win: function (opt) {
      if (st.won) return;
      st.won = true;
      el.clearSteps.textContent = '👣 あるいたマス：' + st.steps;
      el.clearExtra.textContent = (opt && opt.extra) || '';
      el.clearExtra.style.display = el.clearExtra.textContent ? '' : 'none';
      Asobi.sfx('clear');
      setTimeout(function () { el.clear.classList.add('show'); }, 350);
    },
    makeMusic: makeMusic,
    // 絵（キャラ・ゴール）を読みこむ。読みこめたら onload で描き直す
    img: function (src, onload) { var im = new Image(); im.onload = onload; im.src = src; return im; },
    // 絵を (cx, cy) を中心に、size の正方形に描く。まだ読みこめていなければ何もしない
    drawImg: function (ctx, im, cx, cy, size) {
      if (!im || !im.complete || !im.naturalWidth) return;
      ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size);
    }
  };
})();
