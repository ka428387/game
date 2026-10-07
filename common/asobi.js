// あそびのせかい 共通の部品（全ページで最初に読み込む）
// - 音：どのゲームの音も、右上の「おと」ボタン1つでまとめて鳴らす／止める（設定はゲームをまたいで残る）
// - ボタン：左上の「ホームへ」と右上の「おと」を、どのゲームでも同じ形・同じ場所に出す
// - 効果音：Asobi.sfx('ok' | 'ng' | 'clear' | 'tap')。音のないゲームでも同じ音でほめる
//
// ページ側の書き方：
//   <body data-asobi="game">  … ホーム・おとボタンを出す（ふつうのゲーム）
//   <body data-asobi="index"> … ボタンを出さない（ホーム画面）
//   ボタンを決まった場所に置きたいときは、その場所に <span data-asobi-slot="home"></span> などを置く
(function () {
  'use strict';

  var KEY = 'asobi.sound';
  function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var soundOn = load() !== 'off';
  var masters = [];   // 各 AudioContext の出口の音量（0 か 1）
  var contexts = [];

  // ゲームが new AudioContext() したとき、出口（destination）の手前に共通の音量つまみをはさむ。
  // ゲームのコードは今のまま（audioCtx.destination へつなぐ）で、おとボタンが全部に効く。
  var Real = window.AudioContext || window.webkitAudioContext;
  if (Real) {
    var Wrapped = function (opts) {
      var ctx = opts === undefined ? new Real() : new Real(opts);
      var real = ctx.destination;
      var master = ctx.createGain();
      master.gain.value = soundOn ? 1 : 0;
      master.connect(real);
      Object.defineProperty(ctx, 'destination', { get: function () { return master; } });
      masters.push(master);
      contexts.push(ctx);
      return ctx;
    };
    Wrapped.prototype = Real.prototype;
    window.AudioContext = Wrapped;
    if (window.webkitAudioContext) window.webkitAudioContext = Wrapped;
  }

  function applySound() {
    masters.forEach(function (m) { m.gain.value = soundOn ? 1 : 0; });
    var b = document.querySelector('.asobi-sound');
    if (b) {
      b.textContent = soundOn ? '🔊' : '🔇';
      b.setAttribute('aria-label', soundOn ? 'おとを けす' : 'おとを だす');
      b.classList.toggle('off', !soundOn);
    }
  }

  // アプリを裏にまわしたら音を止め、もどったら再開する
  document.addEventListener('visibilitychange', function () {
    contexts.forEach(function (c) {
      try { if (document.hidden) c.suspend(); else if (c.state === 'suspended') c.resume(); } catch (e) {}
    });
  });

  // ── 効果音（やさしい音だけ。高すぎる音・大きすぎる音は使わない） ──
  var sfxCtx = null;
  function getCtx() {
    if (!Real) return null;
    if (!sfxCtx) { try { sfxCtx = new window.AudioContext(); } catch (e) { return null; } }
    if (sfxCtx.state === 'suspended') { try { sfxCtx.resume(); } catch (e) {} }
    return sfxCtx;
  }
  function note(ctx, freq, start, dur, vol, type) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(start); o.stop(start + dur + 0.05);
  }
  var SFX = {
    tap:   function (c, t) { note(c, 660, t, 0.08, 0.12, 'sine'); },
    ok:    function (c, t) { note(c, 523.25, t, 0.18, 0.22); note(c, 783.99, t + 0.12, 0.3, 0.22); },
    ng:    function (c, t) { note(c, 220, t, 0.25, 0.18, 'sine'); note(c, 196, t + 0.15, 0.3, 0.15, 'sine'); },
    clear: function (c, t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { note(c, f, t + i * 0.13, 0.45, 0.2); }); }
  };
  function sfx(name) {
    if (!soundOn || !SFX[name]) return;
    var c = getCtx(); if (!c) return;
    SFX[name](c, c.currentTime + 0.01);
  }

  // ── 左上「ホームへ」・右上「おと」 ──
  function place(btn, slotName) {
    var slot = document.querySelector('[data-asobi-slot="' + slotName + '"]');
    if (slot) { btn.classList.add('in-slot'); slot.appendChild(btn); }
    else document.body.appendChild(btn);
  }
  function mount() {
    var mode = document.body.getAttribute('data-asobi');
    if (mode === 'index') return;
    var home = document.createElement('a');
    home.className = 'asobi-btn asobi-home';
    home.href = 'index.html';
    home.textContent = '🏠 ホームへ';
    place(home, 'home');

    var snd = document.createElement('button');
    snd.type = 'button';
    snd.className = 'asobi-btn asobi-sound';
    snd.addEventListener('click', function () {
      soundOn = !soundOn;
      save(soundOn ? 'on' : 'off');
      applySound();
      if (soundOn) sfx('tap');
    });
    place(snd, 'sound');
    applySound();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.Asobi = {
    sfx: sfx,
    isSoundOn: function () { return soundOn; }
  };
})();
