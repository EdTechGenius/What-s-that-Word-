/*
 * app.js — the What's That Word? interface.
 * Pages (hash routes):
 *   #/           home – choose a corner
 *   #/grammar    Glorious Grammar Corner – colour-coded text, tap a word for its card
 *   #/vocab/word Vivid Vocabulary Corner – dictionary + thesaurus
 *   #/bank       My Word Bank
 */
(function () {
  'use strict';

  const { CLASSES, ORDER } = window.Grammar;
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const THESAURUS_CLASSES = ['noun', 'verb', 'adjective', 'adverb'];

  // ------------------------------------------------------------ storage
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('wtw.' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('wtw.' + key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ }
    },
  };

  const state = {
    text: store.get('text', ''),
    analysis: null,
    editing: true,
    filter: new Set(),
    labels: store.get('labels', true),
    colour: true,
    size: store.get('size', 26),
    dyslexic: store.get('dyslexic', false),
  };

  function applyFont() {
    document.body.classList.toggle('dyslexic', state.dyslexic);
    $$('[data-font-toggle]').forEach((b) => {
      b.setAttribute(b.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(state.dyslexic));
      const l = b.querySelector('.switch-label');
      if (l) l.textContent = state.dyslexic ? 'On' : 'Off';
    });
  }
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('[data-font-toggle]')) return;
    state.dyslexic = !state.dyslexic;
    store.set('dyslexic', state.dyslexic);
    applyFont();
    toast(state.dyslexic ? 'Dyslexia-friendly font switched on' : 'Dyslexia-friendly font switched off');
  });

  // ------------------------------------------------------------ helpers
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const clsInfo = (cls) => CLASSES[cls] || CLASSES.other;
  const badge = (cls, text) => `<span class="badge c-${esc(cls)}"><span class="swatch"></span>${esc(text || clsInfo(cls).label)}</span>`;

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ------------------------------------------------------------ speech
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    voice = voices.find((v) => v.lang === 'en-GB' && /Daniel|Kate|Serena|Martha|Google UK English Female/i.test(v.name)) ||
      voices.find((v) => v.lang === 'en-GB') || voices.find((v) => /^en/.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) { toast('Sorry – this device can’t read aloud.'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-GB';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }

  // ------------------------------------------------------------ word bank
  const bank = {
    all() { return store.get('bank', []); },
    key(word, cls) { return (word + '|' + cls).toLowerCase(); },
    has(word, cls) { return this.all().some((e) => this.key(e.word, e.cls) === this.key(word, cls)); },
    add(entry) {
      const list = this.all().filter((e) => this.key(e.word, e.cls) !== this.key(entry.word, entry.cls));
      list.unshift(Object.assign({ added: new Date().toISOString() }, entry));
      store.set('bank', list);
      updateCount();
    },
    remove(word, cls) {
      store.set('bank', this.all().filter((e) => this.key(e.word, e.cls) !== this.key(word, cls)));
      updateCount();
    },
  };
  function updateCount() {
    const n = bank.all().length;
    const el = document.getElementById('bank-count');
    el.textContent = n;
    el.hidden = n === 0;
  }

  function bankButton(entry, opts) {
    const saved = bank.has(entry.word, entry.cls);
    return `<button class="btn ${opts && opts.small ? 'small' : ''} ${saved ? 'saved' : ''} ${opts && opts.wide ? 'wide' : ''}" data-bank='${esc(JSON.stringify(entry))}'>
      ${saved ? '✓ In my word bank' : '☆ Add to word bank'}</button>`;
  }
  // one listener handles every "add to word bank" button
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-bank]');
    if (!btn) return;
    const entry = JSON.parse(btn.getAttribute('data-bank'));
    if (bank.has(entry.word, entry.cls)) {
      bank.remove(entry.word, entry.cls);
      btn.classList.remove('saved');
      btn.innerHTML = '☆ Add to word bank';
      toast(`Removed “${entry.word}” from your word bank`);
    } else {
      bank.add(entry);
      btn.classList.add('saved');
      btn.innerHTML = '✓ In my word bank';
      toast(`⭐ “${entry.word}” added to your word bank`);
    }
    if (location.hash.startsWith('#/bank')) renderBank();
  });

  // ------------------------------------------------------------ router
  function route() {
    closeModal();
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const page = parts[0] || '';
    const arg = parts.slice(1).join('/');
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === page));
    window.scrollTo(0, 0);
    if (page === 'grammar') renderGrammar();
    else if (page === 'vocab') renderVocab(decodeURIComponent(arg || ''));
    else if (page === 'levelup') renderLevelUp();
    else if (page === 'bank') renderBank();
    else renderHome();
    applyFont();
    app.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);

  // ================================================================ HOME
  function renderHome() {
    document.title = "What's That Word?";
    const sample = [['Marcus', 'propernoun'], ['woke', 'verb'], ['before', 'preposition'], ['the', 'determiner'], ['golden', 'adjective'], ['sun', 'noun']];
    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Every pupil · every text</p>
        <h1>What’s <em>that</em> word?</h1>
        <p class="lead">Explore any text word by word. See every word class in colour, find out what words mean, and collect brilliant words in your own word bank.</p>
      </section>
      <section class="font-option" aria-label="Reading options">
        <div class="font-option-text">
          <span class="font-sample" aria-hidden="true">Aa</span>
          <div>
            <strong>Dyslexia-friendly font</strong>
            <span class="muted small">Switch every page to the OpenDyslexic font.</span>
          </div>
        </div>
        <button class="switch" role="switch" aria-checked="${state.dyslexic}" aria-label="Dyslexia-friendly font (OpenDyslexic)" data-font-toggle>
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="switch-label">${state.dyslexic ? 'On' : 'Off'}</span>
        </button>
      </section>
      <section class="corners" aria-label="Choose a corner">
        <a class="corner grammar" href="#/grammar">
          <span class="corner-icon" aria-hidden="true">✏️</span>
          <h2>Glorious Grammar Corner</h2>
          <div class="sample" aria-hidden="true">${sample.map(([w, c]) => `<span class="c-${c}">${w}</span>`).join('')}</div>
          <p>Type or paste any text. Every word lights up in the colour of its word class. Tap a word to find out what it is, why, and what it means.</p>
          <span class="go">Start exploring →</span>
        </a>
        <a class="corner vocab" href="#/vocab">
          <span class="corner-icon" aria-hidden="true">📖</span>
          <h2>Vivid Vocabulary Corner</h2>
          <p>Look up any word. Get its meaning, its word class and lots of synonyms to make your writing sparkle – a dictionary and thesaurus in one.</p>
          <span class="go">Look up a word →</span>
        </a>
        <a class="corner levelup" href="#/levelup">
          <span class="corner-icon" aria-hidden="true">⚡</span>
          <h2>Level Up!</h2>
          <div class="sample" aria-hidden="true"><span class="lu-demo-old">said</span> → <span class="lu-demo-new">bellowed</span></div>
          <p>Type your writing and swap plain words for ambitious and challenge words. Watch your writing level up!</p>
          <span class="go">Level up my writing →</span>
        </a>
        <a class="corner bank" href="#/bank">
          <span class="corner-icon" aria-hidden="true">⭐</span>
          <h2>My Word Bank</h2>
          <p>All the words you have saved, ready to use in your own writing.</p>
          <span class="go">Open my word bank →</span>
        </a>
      </section>
      <p class="home-foot">Tip for iPad: tap the Share button in Safari, then “Add to Home Screen” to use What’s That Word? like an app.</p>`;
  }

  // ================================================================ GRAMMAR
  const SAMPLES = [
    { title: 'The Lighthouse', text: 'The old lighthouse stood proudly on the jagged rocks. Every night, its golden beam swept slowly across the dark sea. Mira loved to watch it from her small bedroom window.\n\nOne stormy evening, the light suddenly went out! Mira grabbed her torch and raced down the winding path because she knew the fishing boats needed help.' },
    { title: 'Volcanoes', text: 'A volcano is an opening in the surface of the Earth. When pressure builds up underground, hot melted rock called magma rises towards the surface. Some volcanoes erupt violently, but others ooze lava gently down their slopes.' },
    { title: 'The Fox and the Crow', text: 'A hungry fox spotted a crow sitting on a branch with a piece of cheese in its beak. "What beautiful feathers you have!" said the fox sweetly. "I am sure your voice is even lovelier." The proud crow opened her beak to sing, and the cheese fell straight into the clever fox\'s mouth. Oh dear!' },
  ];

  function renderGrammar() {
    document.title = 'Glorious Grammar Corner · What’s That Word?';
    if (state.text && !state.analysis) {
      try { state.analysis = window.Grammar.analyse(state.text); state.editing = false; } catch (e) { state.editing = true; }
    }
    if (state.editing || !state.analysis) renderGrammarInput();
    else renderGrammarReading();
  }

  function renderGrammarInput() {
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">✏️ Corner 1</p>
          <h1>Glorious <em>Grammar</em> Corner</h1>
        </div>
      </div>
      <p class="lead">Write or paste a piece of text below, then press <strong>Colour my words</strong>. Every word will be highlighted by its word class.</p>
      <div class="card input-card">
        <label for="text-in" class="sr-only" hidden>Your text</label>
        <textarea id="text-in" placeholder="Type or paste your text here…" spellcheck="true">${esc(state.text)}</textarea>
        <div class="input-actions">
          <button class="btn primary" id="go">🎨 Colour my words</button>
          <button class="btn ghost" id="clear">Clear</button>
          <span class="spacer"></span>
          <span class="muted small" id="wc"></span>
        </div>
        <div class="samples">
          <h3>No text yet? Try one of these:</h3>
          <div class="chips">${SAMPLES.map((s, i) => `<button class="chip" data-sample="${i}">${esc(s.title)}</button>`).join('')}</div>
        </div>
      </div>`;
    const ta = $('#text-in');
    const wc = () => {
      const n = (ta.value.match(/[A-Za-z0-9’']+/g) || []).length;
      $('#wc').textContent = n ? `${n} word${n === 1 ? '' : 's'}` : '';
    };
    wc();
    ta.addEventListener('input', () => { wc(); store.set('text', ta.value); });
    $('#clear').onclick = () => { ta.value = ''; store.set('text', ''); wc(); ta.focus(); };
    $$('[data-sample]').forEach((b) => { b.onclick = () => { ta.value = SAMPLES[b.dataset.sample].text; wc(); store.set('text', ta.value); }; });
    $('#go').onclick = () => {
      const text = ta.value.trim();
      if (!text) { toast('Type or paste some text first!'); ta.focus(); return; }
      if (text.length > 20000) { toast('That text is very long – try a shorter piece (under 20,000 characters).'); return; }
      state.text = ta.value;
      store.set('text', state.text);
      state.analysis = window.Grammar.analyse(state.text);
      state.filter.clear();
      state.editing = false;
      renderGrammarReading();
      window.scrollTo(0, 0);
    };
  }

  function renderGrammarReading() {
    const a = state.analysis;
    const counts = {};
    a.tokens.forEach((t) => { counts[t.cls] = (counts[t.cls] || 0) + 1; });
    const wordCount = a.tokens.filter((t) => t.cls !== 'other' || /[a-z0-9]/i.test(t.text)).length;

    const body = a.paragraphs.filter((p) => !p.blank).map((p) => '<p>' + p.tokens.map((t) => {
      const lead = esc(t.pre);
      const trail = esc(t.post);
      if (!/[a-z0-9]/i.test(t.text)) return lead + esc(t.text) + trail;
      return `${lead}<button class="w c-${t.cls}" data-id="${t.id}" aria-label="${esc(t.text)}, ${esc(clsInfo(t.cls).label)}"><span class="wt">${esc(t.text)}</span><span class="wl" aria-hidden="true">${esc(clsInfo(t.cls).short)}</span></button>${trail}`;
    }).join('') + '</p>').join('');

    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">✏️ Glorious Grammar Corner</p>
          <h1>Tap any word to <em>explore it</em></h1>
        </div>
      </div>
      <div class="toolbar" role="toolbar" aria-label="Reading tools">
        <button class="btn small" id="edit">✏️ Change text</button>
        <button class="toggle" id="labels" aria-pressed="${state.labels}">🏷️ Labels</button>
        <button class="toggle" id="colour" aria-pressed="${state.colour}">🎨 Colours</button>
        <span class="seg" role="group" aria-label="Text size">
          <button id="smaller" aria-label="Smaller text">A−</button><button id="bigger" aria-label="Bigger text">A+</button>
        </span>
        <span class="spacer"></span>
        <button class="btn small ghost" id="read-all">🔊 Read aloud</button>
        <button class="btn small ghost no-print" id="print">🖨️ Print</button>
      </div>
      <div class="legend ${state.filter.size ? 'filtering' : ''}" id="legend" role="group" aria-label="Word classes – tap to show only that class">
        ${ORDER.filter((c) => counts[c]).map((c) => `<button class="c-${c} ${state.filter.has(c) ? 'on' : ''}" data-cls="${c}" aria-pressed="${state.filter.has(c)}"><span class="swatch"></span>${esc(CLASSES[c].label)} <span class="n">${counts[c]}</span></button>`).join('')}
        ${state.filter.size ? '<button class="c-other on" id="show-all">✕ Show all</button>' : ''}
      </div>
      <p class="legend-hint">Tap a word class above to spot only those words. Tap a word in the text to open its card.</p>
      <div class="stats">${wordCount} words</div>
      <article class="reading ${state.filter.size ? 'filtering' : ''}" id="reading" lang="en">${body}</article>`;

    applyView();
    $('#edit').onclick = () => { state.editing = true; renderGrammarInput(); $('#text-in').focus(); };
    $('#labels').onclick = () => { state.labels = !state.labels; store.set('labels', state.labels); applyView(); };
    $('#colour').onclick = () => { state.colour = !state.colour; applyView(); };
    $('#smaller').onclick = () => { state.size = Math.max(16, state.size - 3); store.set('size', state.size); applyView(); };
    $('#bigger').onclick = () => { state.size = Math.min(56, state.size + 3); store.set('size', state.size); applyView(); };
    $('#read-all').onclick = () => speak(state.text);
    $('#print').onclick = () => window.print();
    $$('#legend [data-cls]').forEach((b) => {
      b.onclick = () => {
        const c = b.dataset.cls;
        if (state.filter.has(c)) state.filter.delete(c); else state.filter.add(c);
        renderGrammarReading();
      };
    });
    const all = $('#show-all');
    if (all) all.onclick = () => { state.filter.clear(); renderGrammarReading(); };
    $('#reading').addEventListener('click', (ev) => {
      const w = ev.target.closest('.w');
      if (!w) return;
      const tok = state.analysis.tokens[+w.dataset.id];
      $$('.w.sel').forEach((x) => x.classList.remove('sel'));
      w.classList.add('sel');
      openWordCard(tok, w);
    });
  }

  function applyView() {
    document.body.classList.toggle('show-labels', state.labels);
    document.body.classList.toggle('no-colour', !state.colour);
    document.documentElement.style.setProperty('--reading-size', state.size + 'px');
    const l = $('#labels'); if (l) l.setAttribute('aria-pressed', state.labels);
    const c = $('#colour'); if (c) c.setAttribute('aria-pressed', state.colour);
    $$('#reading .w').forEach((w) => {
      const cls = (w.className.match(/c-(\w+)/) || [])[1];
      w.classList.toggle('dim', state.filter.size > 0 && !state.filter.has(cls));
    });
  }

  // ---------------------------------------------------------- word card
  let lastFocus = null;
  function openModal(html, cls) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal c-${esc(cls || 'other')}" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div></div>`;
    const back = $('.modal-backdrop', modalRoot);
    back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
    $$('[data-close]', modalRoot).forEach((b) => { b.onclick = closeModal; });
    document.body.style.overflow = 'hidden';
    const first = $('[data-close]', modalRoot);
    if (first) first.focus();
    return $('.modal', modalRoot);
  }
  function closeModal() {
    if (!modalRoot.innerHTML) return;
    modalRoot.innerHTML = '';
    document.body.style.overflow = '';
    $$('.w.sel').forEach((x) => x.classList.remove('sel'));
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab' && modalRoot.innerHTML) {   // keep focus inside the card
      const f = $$('button, a[href], input, summary', modalRoot).filter((x) => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  function highlightInSentence(sentence, word, cls) {
    const safe = esc(sentence);
    const w = esc(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let done = false;
    return safe.replace(new RegExp(`(^|[^A-Za-z’'])(${w})(?![A-Za-z])`), (m, a, b) => {
      if (done) return m;
      done = true;
      return `${a}<mark class="c-${cls}">${b}</mark>`;
    });
  }

  function openWordCard(tok) {
    const ex = window.Grammar.explain(state.analysis, tok);
    const info = clsInfo(ex.cls);
    const showSynonyms = THESAURUS_CLASSES.includes(ex.cls);
    const entry = { word: ex.cls === 'propernoun' ? ex.word : ex.word.toLowerCase(), cls: ex.cls, sub: ex.subLabel, sentence: ex.sentence, definition: '', example: '', synonyms: [] };

    const modal = openModal(`
      <div class="modal-head">
        <div>
          <h2 id="modal-title">${esc(ex.word)}</h2>
          ${badge(ex.cls, ex.subLabel ? cap(ex.subLabel) : info.label)}
        </div>
        <button class="close" data-close aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <section class="meaning-row">
          <div class="big-emoji" aria-hidden="true">${info.emoji}</div>
          <p style="margin:0">${esc(ex.meaning)}</p>
        </section>
        ${ex.note ? `<section class="note">💡 ${esc(ex.note)}</section>` : ''}
        <section>
          <h3>🔍 Why is it ${/^[aeiou]/i.test(info.label) ? 'an' : 'a'} ${esc(info.label.toLowerCase())}?</h3>
          <ul class="reasons">${ex.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        </section>
        <section>
          <h3>📝 In your text</h3>
          <div class="context">${highlightInSentence(ex.sentence, ex.word, ex.cls)}</div>
        </section>
        <section id="def-section">
          <h3>📖 What does it mean?</h3>
          <div id="def"><div class="loading"><span class="spinner"></span> Looking it up…</div></div>
        </section>
        ${showSynonyms ? `<section id="syn-section">
          <h3>🔁 Synonyms <span class="muted small" style="font-weight:400">– words with a similar meaning</span></h3>
          <div id="syn"><div class="loading"><span class="spinner"></span> Finding synonyms…</div></div>
        </section>` : ''}
      </div>
      <div class="modal-foot">
        <button class="btn" id="hear">🔊 Hear it</button>
        <a class="btn" href="#/vocab/${encodeURIComponent(ex.lookup)}">🧪 Word lab</a>
        <span class="wide" id="bank-slot">${bankButton(entry, { wide: true })}</span>
      </div>`, ex.cls);

    $('#hear', modal).onclick = () => speak(ex.word);
    const slot = $('#bank-slot', modal);
    const refreshBank = () => { slot.innerHTML = bankButton(entry, { wide: true }); $('button', slot).style.width = '100%'; };
    refreshBank();

    // ---- definition
    const defEl = $('#def', modal);
    if (ex.cls === 'propernoun') {
      defEl.innerHTML = `<div class="definition">${esc(ex.word)} is a name, so it doesn’t have a dictionary meaning like other words.</div>`;
    } else {
      const candidates = [ex.word.toLowerCase(), ex.lookup];
      window.Lookup.defineAs(candidates, ex.cls).then((res) => {
        if (!modal.isConnected) return;
        if (!res) {
          defEl.innerHTML = `<p class="muted">We couldn’t find “${esc(ex.word)}” in the dictionary.</p>`;
          return;
        }
        entry.definition = res.best.definition;
        entry.example = res.best.example;
        refreshBank();
        const formNote = res.lookedUp !== ex.word.toLowerCase()
          ? `<p class="small muted" style="margin:0 0 8px">We looked up <strong>${esc(res.lookedUp)}</strong>${ex.form === 'past' ? ` – “${esc(ex.word)}” is its past tense` : ex.form === 'plural' ? ` – “${esc(ex.word)}” means more than one` : ex.form === 'ing' ? ` – “${esc(ex.word)}” is its -ing form` : ''}.</p>` : '';
        const posNote = !res.matched
          ? `<p class="small muted" style="margin:0 0 8px">The dictionary lists this word as ${/^[aeiou]/.test(res.meaning.pos) ? 'an' : 'a'} ${esc(res.meaning.pos)}, so this meaning might not fit perfectly here.</p>` : '';
        const others = res.meaning.definitions.filter((d) => d !== res.best).slice(0, 5);
        defEl.innerHTML = `${formNote}${posNote}
          <div class="definition">${esc(res.best.definition)}</div>
          ${res.best.example ? `<p class="example"><span>“${esc(res.best.example)}”</span><button class="icon-btn" data-say="${esc(res.best.example)}" aria-label="Hear the example">🔊</button></p>` : ''}
          ${others.length ? `<details class="more"><summary>More meanings (${others.length})</summary><ol>${others.map((d) => `<li>${esc(d.definition)}</li>`).join('')}</ol></details>` : ''}
          <p class="source">From the Free Dictionary (Wiktionary).</p>`;
        $$('[data-say]', defEl).forEach((b) => { b.onclick = () => speak(b.dataset.say); });
        if (showSynonyms) loadSynonyms(res.lookedUp, res.matched ? res.meaning.synonyms : []);
      }).catch(() => {
        if (!modal.isConnected) return;
        defEl.innerHTML = offlineMsg();
        if (showSynonyms) loadSynonyms(ex.lookup, []);
      });
    }

    // ---- synonyms
    let synLoaded = false;
    function loadSynonyms(word, extra) {
      if (synLoaded) return;
      synLoaded = true;
      const synEl = $('#syn', modal);
      window.Lookup.synonyms(word, ex.cls, extra).then((list) => {
        if (!modal.isConnected) return;
        const shaped = Array.from(new Set(list.map((s) => window.Grammar.inflect(s, ex.form))))
          .filter((s) => s.toLowerCase() !== ex.word.toLowerCase()).slice(0, 10);
        entry.synonyms = shaped.slice(0, 6);
        refreshBank();
        synEl.innerHTML = shaped.length
          ? `<div class="chips">${shaped.map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>
             <p class="source">Tap a synonym to explore it in the Vivid Vocabulary Corner.</p>`
          : '<p class="muted" style="margin:0">No synonyms for this word – sometimes the word you have is already the best one!</p>';
      }).catch(() => {
        if (modal.isConnected) synEl.innerHTML = '<p class="muted" style="margin:0">Synonyms need an internet connection.</p>';
      });
    }
  }

  function offlineMsg() {
    return `<p class="muted" style="margin:0">📡 We couldn’t reach the dictionary. Check the internet connection and try again.</p>`;
  }

  // ================================================================ VOCAB
  const VOCAB_IDEAS = {
    lower: ['enormous', 'whisper', 'gloomy', 'swiftly', 'courage', 'glimmer', 'furious', 'tremble'],
    upper: ['petrified', 'ominous', 'meander', 'exhilarated', 'tenacious', 'luminous', 'dilapidated', 'melancholy'],
  };
  const LEVELS = {
    lower: { label: 'Lower primary', emoji: '🌱', blurb: 'Clear meanings, examples and everyday synonyms.', luBlurb: 'Swap plain words like said, nice, went and big for more exciting words.' },
    upper: { label: 'Upper primary', emoji: '🚀', blurb: 'Deeper explanations, challenging synonyms sorted by level, word parts, word families, example sentences and a sentence challenge.', luBlurb: 'Ambitious and challenge words, one powerful word instead of “very…”, and fronted adverbials instead of “Then”.' },
  };
  const TIERS = [
    ['challenge', '🚀 Challenge words', 'rare and impressive'],
    ['ambitious', '✨ Ambitious words', 'great for upgrading your writing'],
    ['everyday', '👍 Everyday words', 'words you probably know already'],
  ];

  function renderVocab(word) {
    document.title = 'Vivid Vocabulary Corner · What’s That Word?';
    const level = store.get('level', null);
    if (!LEVELS[level]) { renderLevelChoice(word); return; }
    const recent = store.get('recent', []);
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">📖 Corner 2</p>
          <h1>Vivid <em>Vocabulary</em> Corner</h1>
        </div>
        <div class="seg level-switch" role="group" aria-label="Level">
          ${Object.keys(LEVELS).map((l) => `<button data-level="${l}" aria-pressed="${l === level}">${LEVELS[l].emoji} ${LEVELS[l].label}</button>`).join('')}
        </div>
      </div>
      <form class="search" id="vocab-form" role="search">
        <input id="vocab-in" type="search" placeholder="Type a word…" autocomplete="off" autocapitalize="none" spellcheck="true" aria-label="Word to look up" value="${esc(word)}">
        <button class="btn primary" type="submit">Look it up</button>
      </form>
      <div class="search-extras">
        <div class="chips"><span class="label">Try:</span>${VOCAB_IDEAS[level].map((w) => `<a class="chip" href="#/vocab/${w}">${w}</a>`).join('')}</div>
        ${recent.length ? `<div class="chips"><span class="label">Recent:</span>${recent.map((w) => `<a class="chip" href="#/vocab/${encodeURIComponent(w)}">${esc(w)}</a>`).join('')}</div>` : ''}
      </div>
      <div id="vocab-out"></div>`;
    $$('[data-level]').forEach((b) => {
      b.onclick = () => { store.set('level', b.dataset.level); renderVocab(word); };
    });
    $('#vocab-form').onsubmit = (e) => {
      e.preventDefault();
      const w = window.Lookup.cleanWord($('#vocab-in').value);
      if (!w) { toast('Type a word to look up'); return; }
      const target = '#/vocab/' + encodeURIComponent(w);
      if (location.hash === target) renderVocab(w); else location.hash = target;
    };
    if (word) (level === 'upper' ? lookupUpper : lookupWord)(word);
    else $('#vocab-in').focus();
  }

  function renderLevelChoice(word, corner) {
    const isLU = corner === 'levelup';
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">${isLU ? '⚡ Corner 3' : '📖 Corner 2'}</p>
          <h1>${isLU ? 'Level <em>Up!</em>' : 'Vivid <em>Vocabulary</em> Corner'}</h1>
        </div>
      </div>
      <p class="lead">Who is exploring words today? Choose your level. You can change it at any time.</p>
      <div class="corners levels">
        ${Object.keys(LEVELS).map((l) => `
          <button class="corner level-card ${l}" data-pick="${l}">
            <span class="corner-icon" aria-hidden="true">${LEVELS[l].emoji}</span>
            <h2>${LEVELS[l].label}</h2>
            <p>${esc(isLU ? LEVELS[l].luBlurb : LEVELS[l].blurb)}</p>
            <span class="go">Choose ${LEVELS[l].label.toLowerCase()} →</span>
          </button>`).join('')}
      </div>`;
    $$('[data-pick]').forEach((b) => {
      b.onclick = () => { store.set('level', b.dataset.pick); if (isLU) renderLevelUp(); else renderVocab(word); };
    });
  }

  /** Look a word up (trying its base form too). Shows a message and returns null if not found. */
  async function fetchWordInfo(word, out) {
    out.innerHTML = '<div class="loading"><span class="spinner"></span> Looking up “' + esc(word) + '”…</div>';
    let info;
    try {
      info = await window.Lookup.define(word);
      // try the base form if the exact word isn't listed (e.g. "gleaming" -> "gleam")
      if (!info) {
        const a = window.Grammar.analyse(word).tokens[0];
        const base = a && a.root && a.root !== word ? a.root : null;
        if (base) { info = await window.Lookup.define(base); if (info) info.from = word; }
      }
    } catch (e) {
      if (out.isConnected) out.innerHTML = `<div class="notice">${offlineMsg()}</div>`;
      return null;
    }
    if (out !== $('#vocab-out')) return null;   // user moved on
    if (!info) {
      const sug = await window.Lookup.suggest(word).catch(() => []);
      out.innerHTML = `<div class="notice">
        <h3>🤔 We couldn’t find “${esc(word)}”</h3>
        <p style="margin:0 0 10px">Check the spelling and try again.</p>
        ${sug.length ? `<div class="chips"><span class="label muted">Did you mean:</span>${sug.map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>` : ''}
      </div>`;
      return null;
    }
    store.set('recent', [word].concat(store.get('recent', []).filter((w) => w !== word)).slice(0, 10));
    return info;
  }

  // ---- highlighting a word (and its other forms) inside a sentence
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function wordForms() {
    const set = new Set();
    Array.from(arguments).filter(Boolean).forEach((w) => {
      const lw = String(w).toLowerCase();
      set.add(lw);
      const stem = lw.replace(/(ied|ies|ed|ing|es|s|e|y)$/, '');
      if (stem.length >= 4) set.add(stem + '*');
    });
    return Array.from(set);
  }
  function formsRegex(forms, anchored) {
    const pats = forms.map((f) => (f.endsWith('*') ? escRe(f.slice(0, -1)) + '[a-z]*' : escRe(f))).sort((a, b) => b.length - a.length);
    return anchored ? new RegExp(`^(${pats.join('|')})$`, 'i') : new RegExp(`\\b(${pats.join('|')})\\b`, 'gi');
  }
  function markWord(text, forms) {
    const re = formsRegex(forms);
    let html = '';
    let last = 0;
    String(text).replace(re, (m, g, idx) => {
      html += esc(text.slice(last, idx)) + `<mark class="hl">${esc(m)}</mark>`;
      last = idx + m.length;
      return m;
    });
    return html + esc(text.slice(last));
  }
  const chipList = (list) => `<div class="chips">${list.map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>`;

  // ------------------------------------------------------- lower primary
  async function lookupWord(raw) {
    const out = $('#vocab-out');
    const word = window.Lookup.cleanWord(raw);
    if (!word) return;
    const info = await fetchWordInfo(word, out);
    if (!info) return;
    const classes = info.meanings.map((m) => m.cls);
    const forms = wordForms(info.word, info.from);
    out.innerHTML = `
      ${wordHead(info)}
      <div class="can-be"><span class="muted">“${esc(info.word)}” can be ${classes.length > 1 ? 'used as' : 'a'}:</span> ${classes.map((c) => badge(c)).join(' ')}</div>
      <div class="vocab-grid">
        <div id="meanings">
          ${info.meanings.map((m) => meaningCard(info, m, forms)).join('')}
        </div>
        <aside class="card thesaurus" id="thesaurus">
          <h3>🔁 Thesaurus</h3>
          <div class="loading"><span class="spinner"></span> Finding more words…</div>
        </aside>
      </div>
      <p class="source">Definitions from the Free Dictionary API (Wiktionary, CC BY-SA). Thesaurus from Datamuse.</p>`;
    wireWordPage(info, out);

    window.Lookup.thesaurus(info.word).then((t) => {
      const el = $('#thesaurus');
      if (!el) return;
      const groups = Object.keys(t.synonyms).filter((c) => c !== 'other').sort((a, b) => classes.indexOf(a) - classes.indexOf(b));
      if (t.synonyms.other && !groups.length) groups.push('other');
      let html = '<h3>🔁 Thesaurus</h3>';
      if (groups.length) {
        html += groups.map((c) => `<div class="group"><h4>${badge(c, c === 'other' ? 'Similar words' : `Similar ${CLASSES[c].label.toLowerCase()}s`)}</h4>${chipList(t.synonyms[c].slice(0, 18))}</div>`).join('');
      } else {
        html += '<p class="muted">No synonyms found for this word.</p>';
      }
      if (t.antonyms.length) html += `<div class="group"><h4>↔️ Opposites (antonyms)</h4>${chipList(t.antonyms.slice(0, 12))}</div>`;
      if (t.describedBy.length && classes.includes('noun')) {
        html += `<div class="group"><h4>✨ Adjectives to describe a ${esc(info.word)}</h4>${chipList(t.describedBy)}</div>`;
      }
      if (t.describes.length && classes.includes('adjective')) {
        html += `<div class="group"><h4>🧩 Things that can be ${esc(info.word)}</h4>${chipList(t.describes.slice(0, 12))}</div>`;
      }
      el.innerHTML = html;
    }).catch(() => {
      const el = $('#thesaurus');
      if (el) el.innerHTML = '<h3>🔁 Thesaurus</h3><p class="muted">The thesaurus needs an internet connection.</p>';
    });
  }

  function wordHead(info, extra) {
    return `
      <div class="word-head">
        <div>
          <h2>${esc(info.word)}</h2>
          ${info.phonetic ? `<div class="phonetic">${esc(info.phonetic)}</div>` : ''}
          ${info.from ? `<div class="small muted">You searched for “${esc(info.from)}”, which comes from “${esc(info.word)}”.</div>` : ''}
        </div>
        ${extra || ''}
        <div class="actions">
          <button class="btn" id="say-word">🔊 Hear it</button>
        </div>
      </div>`;
  }

  function wireWordPage(info, out) {
    $('#say-word').onclick = () => {
      if (info.audio) { const a = new Audio(info.audio); a.play().catch(() => speak(info.word)); } else speak(info.word);
    };
    out.addEventListener('click', (ev) => {
      const say = ev.target.closest('[data-say]');
      if (say) speak(say.dataset.say);
      const more = ev.target.closest('.more-defs');
      if (more) {
        more.previousElementSibling.querySelectorAll('[hidden]').forEach((li) => { li.hidden = false; });
        more.remove();
      }
    });
  }

  function meaningCard(info, m, forms) {
    const defs = m.definitions;
    const shown = 3;
    const entry = {
      word: info.word, cls: m.cls, definition: defs[0].definition, example: (defs.find((d) => d.example) || {}).example || '',
      synonyms: m.synonyms.slice(0, 6),
    };
    const label = m.cls === 'other' ? cap(m.pos) : clsInfo(m.cls).label;
    return `
      <section class="card meaning-card c-${m.cls}">
        <header>
          <h3 style="margin:0">${badge(m.cls, label)}</h3>
          ${bankButton(entry, { small: true })}
        </header>
        ${m.cls !== 'other' ? `<p class="what">${clsInfo(m.cls).emoji} ${esc(article(label))} ${esc(label.toLowerCase())}: ${esc(clsInfo(m.cls).kid)}</p>` : ''}
        <ol class="defs">
          ${defs.map((d, i) => `<li ${i >= shown ? 'hidden' : ''}>${esc(d.definition)}${d.example ? `<span class="ex">“${markWord(d.example, forms)}” <button class="icon-btn" data-say="${esc(d.example)}" aria-label="Hear the example">🔊</button></span>` : ''}</li>`).join('')}
        </ol>
        ${defs.length > shown ? `<button class="btn small ghost more-defs">Show ${defs.length - shown} more meaning${defs.length - shown === 1 ? '' : 's'}</button>` : ''}
        ${m.synonyms.length ? `<p class="sub-h">Synonyms</p>${chipList(m.synonyms.slice(0, 12))}` : ''}
        ${m.antonyms.length ? `<p class="sub-h">Opposites</p>${chipList(m.antonyms.slice(0, 8))}` : ''}
      </section>`;
  }
  function article(s) { return /^[aeiou]/i.test(s) ? 'An' : 'A'; }

  // ------------------------------------------------------- upper primary
  // "simple past tense of petrify" -> { base: 'petrify', form: 'past' }
  function inflectionHint(m) {
    for (const d of m.definitions.slice(0, 2)) {
      const r = /(simple past|past tense|past participle|present participle|plural|third-person singular)[^.;]*? of ([a-z-]+)/i.exec(d.definition);
      if (r) {
        const kind = r[1].toLowerCase();
        return { base: r[2].toLowerCase(), form: kind === 'plural' ? 'plural' : kind === 'present participle' ? 'ing' : kind.startsWith('third') ? 'present3' : 'past' };
      }
    }
    return null;
  }

  function conjugate(verb) {
    try {
      return window.nlp(verb).tag('Infinitive').verbs().conjugate()[0] || null;
    } catch (e) { return null; }
  }

  function upperTip(m, word, forms) {
    const hl = (t) => markWord(t, forms);
    if (m.cls === 'adjective') {
      return `Use it <strong>before a noun</strong> (“${hl(`a ${word} face`)}”) or <strong>after a verb</strong> such as <em>was</em>, <em>felt</em> or <em>looked</em> (“${hl(`She felt ${word}.`)}”).`;
    }
    if (m.cls === 'noun') {
      return `Put a <strong>determiner</strong> in front (“${hl(`the ${word}`)}”, “${hl(`a ${word}`)}”) and add an <strong>adjective</strong> to make it more vivid.`;
    }
    if (m.cls === 'verb') {
      const hint = inflectionHint(m);
      const c = conjugate(hint ? hint.base : word);
      if (c && c.PastTense && c.PresentTense) {
        return `Change the tense: <strong>today</strong> it ${esc(c.PresentTense)} · <strong>yesterday</strong> it ${esc(c.PastTense)} · <strong>right now</strong> it is ${esc(c.Gerund || '')}.`;
      }
      return `It is a verb, so it changes with time (tense).`;
    }
    if (m.cls === 'adverb') {
      return `It tells you how, when, where or how often. Try it at the <strong>start of a sentence</strong> followed by a comma to make a fronted adverbial: “${hl(`${cap(word)}, the door creaked open.`)}”`;
    }
    return '';
  }

  function upperMeaningCard(info, m, forms) {
    const defs = m.definitions;
    const shown = 6;
    const examples = defs.filter((d) => d.example).map((d) => d.example);
    const entry = {
      word: info.word, cls: m.cls, definition: defs[0].definition, example: examples[0] || '',
      synonyms: m.synonyms.slice(0, 6),
    };
    const label = m.cls === 'other' ? cap(m.pos) : clsInfo(m.cls).label;
    const tip = upperTip(m, info.word, forms);
    return `
      <section class="card meaning-card c-${m.cls}">
        <header>
          <h3 style="margin:0">${badge(m.cls, `As ${article(label).toLowerCase()} ${label.toLowerCase()}`)}</h3>
          ${bankButton(entry, { small: true })}
        </header>
        ${m.cls !== 'other' ? `<p class="what">${clsInfo(m.cls).emoji} ${esc(article(label))} ${esc(label.toLowerCase())}: ${esc(clsInfo(m.cls).kid)}</p>` : ''}
        <p class="sub-h">📖 Meanings</p>
        <ol class="defs">
          ${defs.map((d, i) => `<li ${i >= shown ? 'hidden' : ''}>${esc(d.definition)}</li>`).join('')}
        </ol>
        ${defs.length > shown ? `<button class="btn small ghost more-defs">Show ${defs.length - shown} more meaning${defs.length - shown === 1 ? '' : 's'}</button>` : ''}
        <p class="sub-h">📌 Example sentences</p>
        <ul class="examples">
          ${examples.slice(0, 3).map((e) => exampleItem(e, forms)).join('')}
        </ul>
        <div class="ex-slot" data-cls="${m.cls}" data-have="${Math.min(examples.length, 3)}">
          ${examples.length < 3 ? '<div class="loading small"><span class="spinner"></span> Finding example sentences…</div>' : ''}
        </div>
        ${tip ? `<p class="tip">💡 <strong>Grammar tip:</strong> ${tip}</p>` : ''}
      </section>`;
  }
  function exampleItem(text, forms) {
    return `<li><span>${markWord(text, forms)}</span><button class="icon-btn" data-say="${esc(text)}" aria-label="Hear the example">🔊</button></li>`;
  }

  async function lookupUpper(raw) {
    const out = $('#vocab-out');
    const word = window.Lookup.cleanWord(raw);
    if (!word) return;
    const info = await fetchWordInfo(word, out);
    if (!info) return;
    const classes = info.meanings.map((m) => m.cls);
    const forms = wordForms(info.word, info.from);
    const alive = () => out.isConnected && out === $('#vocab-out');

    out.innerHTML = `
      ${wordHead(info, '<div class="meter" id="meter" hidden></div>')}
      <div class="can-be"><span class="muted">“${esc(info.word)}” can be ${classes.length > 1 ? 'used as' : 'a'}:</span> ${classes.map((c) => badge(c)).join(' ')}</div>
      <div class="vocab-grid">
        <div>
          ${info.meanings.map((m) => upperMeaningCard(info, m, forms)).join('')}
          <section class="card detective" id="detective">
            <h3>🕵️ Word detective</h3>
            <div class="loading"><span class="spinner"></span> Looking for clues…</div>
          </section>
          <section class="card your-turn">
            <h3>✍️ Your turn</h3>
            <p style="margin-top:0">Write your own sentence using <strong>${esc(info.from || info.word)}</strong>. The grammar checker will tell you which word class you used it as.</p>
            <textarea id="my-sentence" rows="3" placeholder="Write your sentence here…" spellcheck="true"></textarea>
            <div class="input-actions">
              <button class="btn primary" id="check-sentence">✅ Check my sentence</button>
              <button class="btn" id="hear-sentence">🔊 Hear it</button>
            </div>
            <div id="sentence-result" aria-live="polite"></div>
          </section>
        </div>
        <aside class="card thesaurus upper" id="thesaurus">
          <h3>🔁 Thesaurus</h3>
          <div class="loading"><span class="spinner"></span> Finding challenging words…</div>
        </aside>
      </div>
      <p class="source">Definitions and example sentences from the Free Dictionary API and Wiktionary (CC BY-SA). Thesaurus, word levels and word families from Datamuse.</p>`;
    wireWordPage(info, out);
    wireYourTurn(info, classes, forms);

    // how ambitious is this word?
    window.Lookup.frequency(info.word).then((f) => {
      const el = $('#meter');
      if (!alive() || f == null || !el) return;
      const tier = window.Lookup.tierOf(f);
      const idx = { everyday: 1, ambitious: 2, challenge: 3 }[tier];
      const name = { everyday: '👍 Everyday word', ambitious: '✨ Ambitious word', challenge: '🚀 Challenge word' }[tier];
      el.hidden = false;
      el.innerHTML = `<span class="meter-label">Word level</span>
        <span class="meter-bar" aria-hidden="true">${[1, 2, 3].map((i) => `<span class="${i <= idx ? 'on' : ''}"></span>`).join('')}</span>
        <strong>${name}</strong>`;
      el.title = `Used about ${f < 1 ? 'less than once' : Math.round(f) + ' times'} in every million words`;
    }).catch(() => {});

    // more example sentences from Wiktionary
    window.Lookup.examples(info.word).catch(() => ({})).then((ex) => {
      if (!alive()) return;
      $$('.ex-slot', out).forEach((slot) => {
        const have = +slot.dataset.have;
        const existing = $$('.examples li span', slot.parentElement).map((s) => s.textContent);
        const extra = (ex[slot.dataset.cls] || [])
          .filter((t) => formsRegex(forms).test(t) && !existing.includes(t))
          .slice(0, Math.max(0, 3 - have));
        if (extra.length) $('.examples', slot.parentElement).insertAdjacentHTML('beforeend', extra.map((e) => exampleItem(e, forms)).join(''));
        slot.innerHTML = (have + extra.length) ? '' : '<p class="muted small" style="margin:0">No example sentence found for this meaning. Can you write one in <strong>Your turn</strong> below?</p>';
      });
    });

    upperThesaurus(info, classes, alive);
    upperDetective(info, alive);
  }

  async function upperThesaurus(info, classes, alive) {
    const targets = info.meanings.filter((m) => THESAURUS_CLASSES.includes(m.cls));
    const extrasP = window.Lookup.thesaurus(info.word).catch(() => null);
    const groups = await Promise.all(targets.map(async (m) => {
      const hint = inflectionHint(m);
      const base = hint ? hint.base : info.word;
      let list = await window.Lookup.richSynonyms(base, m.cls, {
        extra: m.synonyms, bases: !hint && info.from ? [info.from] : [],
      }).catch(() => []);
      if (hint) list = list.map((x) => Object.assign({}, x, { word: window.Grammar.inflect(x.word, hint.form) }));
      const seen = new Set([info.word]);
      list = list.filter((x) => !seen.has(x.word) && seen.add(x.word));
      return { m, list, hint };
    }));
    const t = await extrasP;
    const el = $('#thesaurus');
    if (!alive() || !el) return;

    const tierChips = (items, tier) => `<div class="chips">${items.map((x) => `<a class="chip tier-${tier}" href="#/vocab/${encodeURIComponent(x.word)}">${esc(x.word)}</a>`).join('')}</div>`;
    let html = '<h3>🔁 Thesaurus</h3><p class="small muted" style="margin-top:-4px">Synonyms sorted from the most challenging to the most everyday. Tap one to explore it.</p>';
    groups.forEach(({ m, list, hint }) => {
      const label = clsInfo(m.cls).label.toLowerCase();
      html += `<div class="group"><h4>${badge(m.cls, `Synonyms as ${/^[aeiou]/.test(label) ? 'an' : 'a'} ${label}`)}</h4>`;
      if (hint) html += `<p class="small muted" style="margin:0 0 8px">Synonyms for “${esc(hint.base)}”, changed to match “${esc(info.word)}”.</p>`;
      if (!list.length) {
        html += `<p class="muted small">No synonyms found for it as ${/^[aeiou]/.test(label) ? 'an' : 'a'} ${label}.</p>`;
      } else {
        TIERS.forEach(([tier, title, note]) => {
          const items = list.filter((x) => x.tier === tier).slice(0, 14);
          if (items.length) html += `<p class="tier-h">${title} <span class="muted">– ${note}</span></p>${tierChips(items, tier)}`;
        });
      }
      html += '</div>';
    });
    if (!groups.length) html += '<p class="muted">This kind of word doesn’t really have synonyms – it does an important job in the sentence!</p>';
    if (t && t.antonyms.length) html += `<div class="group"><h4>↔️ Opposites (antonyms)</h4>${chipList(t.antonyms.slice(0, 16))}</div>`;
    if (t && t.describedBy.length && classes.includes('noun')) {
      html += `<div class="group"><h4>🎨 Adjectives to describe a ${esc(info.word)}</h4>${chipList(t.describedBy)}</div>`;
    }
    if (t && t.describes.length && classes.includes('adjective')) {
      html += `<div class="group"><h4>🧩 Things that can be ${esc(info.word)}</h4>${chipList(t.describes.slice(0, 16))}</div>`;
    }
    el.innerHTML = html;
  }

  async function upperDetective(info, alive) {
    const isWord = (w, min) => window.Lookup.isWord(w, min == null ? 0.3 : min).catch(() => false);
    const [parts, phr] = await Promise.all([
      window.WordParts.analyse(info.word, isWord).catch(() => ({ parts: [], base: info.word })),
      window.Lookup.phrases(info.word).catch(() => []),
    ]);
    const famBase = parts.base && parts.base.length >= 4 ? parts.base : info.word;
    const fam = await window.Lookup.family(famBase).catch(() => []);
    const el = $('#detective');
    if (!alive() || !el) return;
    let html = '<h3>🕵️ Word detective</h3>';
    if (parts.parts.length) {
      html += `<p class="sub-h">🧩 Word parts</p>
        <div class="parts">${parts.parts.map((p) => `
          <div class="part part-${p.type}">
            <span class="pt">${esc(p.text)}</span>
            <span class="pk">${{ prefix: 'prefix', suffix: 'suffix', root: 'root', base: 'base word' }[p.type]}</span>
            ${p.meaning && p.type !== 'base' ? `<span class="pm">${esc(p.meaning)}${p.origin ? ` <em>(${esc(p.origin)})</em>` : ''}</span>` : ''}
          </div>`).join('<span class="plus" aria-hidden="true">+</span>')}</div>
        <p class="small muted">Word parts are clues to what a word means, but they don’t always tell the whole story!</p>`;
    }
    const famOthers = fam.filter((x) => x.word !== info.word);
    if (famOthers.length) {
      html += `<p class="sub-h">👪 Word family <span class="muted small" style="font-weight:400">– words built from the same root</span></p>
        <div class="chips">${famOthers.map((x) => `<a class="chip" href="#/vocab/${encodeURIComponent(x.word)}">${x.cls !== 'other' ? `<span class="swatch c-${x.cls}" title="${esc(clsInfo(x.cls).label)}"></span>` : ''}${esc(x.word)}</a>`).join('')}</div>`;
    }
    if (phr.length) {
      html += `<p class="sub-h">🔗 Often found together</p>
        <div class="chips">${phr.map((p) => `<span class="chip phrase">${markWord(p.text, [info.word])}</span>`).join('')}</div>`;
    }
    if (!parts.parts.length && !famOthers.length && !phr.length) html += '<p class="muted">No extra clues found for this word.</p>';
    el.innerHTML = html;
  }

  function wireYourTurn(info, classes, forms) {
    const ta = $('#my-sentence');
    const res = $('#sentence-result');
    $('#hear-sentence').onclick = () => { if (ta.value.trim()) speak(ta.value.trim()); else toast('Write a sentence first!'); };
    $('#check-sentence').onclick = () => {
      const text = ta.value.trim();
      if (!text) { toast('Write a sentence first!'); ta.focus(); return; }
      const analysis = window.Grammar.analyse(text);
      const exact = formsRegex(forms, true);
      const tok = analysis.tokens.find((t) => exact.test(t.text.replace(/[’']s$/, '')));
      const tips = [];
      if (!/^["'“‘(]*[A-Z]/.test(text)) tips.push('Remember to start your sentence with a capital letter.');
      if (!/[.!?]["'”’)]*$/.test(text)) tips.push('Remember to end your sentence with a full stop, question mark or exclamation mark.');
      const tipHtml = tips.length ? `<ul class="tips">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
      if (!tok) {
        res.innerHTML = `<div class="feedback try">🔎 I can’t spot “${esc(info.from || info.word)}” in your sentence yet. Check the spelling and try again!</div>${tipHtml}`;
        return;
      }
      const ex = window.Grammar.explain(analysis, tok);
      const label = clsInfo(tok.cls).label.toLowerCase();
      const a = /^[aeiou]/.test(label) ? 'an' : 'a';
      const sentenceHtml = `<div class="context">${highlightInSentence(text, tok.text, tok.cls)}</div>`;
      if (classes.includes(tok.cls) || (tok.cls === 'propernoun' && classes.includes('noun'))) {
        const meaning = info.meanings.find((m) => m.cls === tok.cls);
        const entry = {
          word: info.word, cls: tok.cls, sentence: text,
          definition: meaning ? meaning.definitions[0].definition : '', example: '', synonyms: meaning ? meaning.synonyms.slice(0, 6) : [],
        };
        res.innerHTML = `<div class="feedback good">🎉 Brilliant! You used “${esc(tok.text)}” as ${a} <strong>${esc(label)}</strong>. ${esc(ex.reasons[0] || '')}</div>
          ${sentenceHtml}${tipHtml}
          <div style="margin-top:10px">${bankButton(entry, { small: true })}</div>`;
      } else {
        const list = classes.filter((c) => c !== 'other').map((c) => clsInfo(c).label.toLowerCase());
        res.innerHTML = `<div class="feedback try">🤔 The grammar checker thinks you used “${esc(tok.text)}” as ${a} <strong>${esc(label)}</strong>, but the dictionary lists it as: ${esc(list.join(', '))}. Have another look, or talk about it with your teacher. The checker can make mistakes too!</div>
          ${sentenceHtml}${tipHtml}`;
      }
    };
  }

  // ================================================================ LEVEL UP
  const LU_SAMPLES = [
    { title: 'At the park', text: 'It was a nice day so we went to the park. The big dog ran fast and I was very happy.' },
    { title: 'The spooky house', text: '"Who is there?" said Sam. He walked into the dark house. It was very cold and he was scared. Then he saw a strange thing on the floor.' },
    { title: 'Lunch time', text: 'I was very hungry so I ate my sandwich quickly. It was really good. Then I got a small cake and we had fun.' },
  ];
  const LU_TIER = {
    lower: ['⭐ Try one of these', ''],
    ambitious: ['✨ Ambitious words', 'great for upgrading your writing'],
    challenge: ['🚀 Challenge words', 'rare and impressive'],
  };
  const lu = {
    text: store.get('lutext', ''),
    analysis: null,
    units: [],
    editing: true,
  };

  function levelSwitch(level) {
    return `<div class="seg level-switch" role="group" aria-label="Level">
      ${Object.keys(LEVELS).map((l) => `<button data-level="${l}" aria-pressed="${l === level}">${LEVELS[l].emoji} ${LEVELS[l].label}</button>`).join('')}
    </div>`;
  }

  function renderLevelUp() {
    document.title = 'Level Up! · What’s That Word?';
    const level = store.get('level', null);
    if (!LEVELS[level]) { renderLevelChoice('', 'levelup'); return; }
    if (lu.text && !lu.analysis) startLevelUp(lu.text);
    if (lu.editing || !lu.analysis) renderLevelUpInput(level);
    else renderLevelUpResult(level);
    $$('[data-level]').forEach((b) => {
      b.onclick = () => { store.set('level', b.dataset.level); renderLevelUp(); };
    });
  }

  function luHead(level) {
    return `<div class="page-head">
        <div>
          <p class="eyebrow">⚡ Corner 3</p>
          <h1>Level <em>Up!</em></h1>
        </div>
        ${levelSwitch(level)}
      </div>`;
  }

  function renderLevelUpInput(level) {
    app.innerHTML = `
      ${luHead(level)}
      <p class="lead">${level === 'upper'
        ? 'Type or paste your writing. Plain words will be underlined, so you can swap them for <strong>✨ ambitious</strong> or <strong>🚀 challenge</strong> words. Phrases like “very big” become one powerful word, and sentences starting with “Then” get a fronted adverbial.'
        : 'Type or paste your writing. Plain words like <em>said</em>, <em>nice</em>, <em>went</em> and <em>big</em> will be underlined, so you can swap them for more exciting words!'}</p>
      <div class="card input-card">
        <textarea id="lu-in" placeholder="Type or paste your sentence here…" spellcheck="true">${esc(lu.text)}</textarea>
        <div class="input-actions">
          <button class="btn primary" id="lu-go">⚡ Level up my writing</button>
          <button class="btn ghost" id="lu-clear">Clear</button>
        </div>
        <div class="samples">
          <h3>Need something to practise on? Try one of these:</h3>
          <div class="chips">${LU_SAMPLES.map((s, i) => `<button class="chip" data-lu-sample="${i}">${esc(s.title)}</button>`).join('')}</div>
        </div>
      </div>`;
    const ta = $('#lu-in');
    ta.addEventListener('input', () => { lu.text = ta.value; store.set('lutext', ta.value); });
    $('#lu-clear').onclick = () => { ta.value = ''; lu.text = ''; store.set('lutext', ''); ta.focus(); };
    $$('[data-lu-sample]').forEach((b) => {
      b.onclick = () => { ta.value = LU_SAMPLES[b.dataset.luSample].text; lu.text = ta.value; store.set('lutext', ta.value); };
    });
    $('#lu-go').onclick = () => {
      const text = ta.value.trim();
      if (!text) { toast('Type or paste some writing first!'); ta.focus(); return; }
      if (text.length > 5000) { toast('That’s a lot of writing! Try a shorter piece (under 5,000 characters).'); return; }
      startLevelUp(ta.value);
      lu.editing = false;
      renderLevelUp();
      window.scrollTo(0, 0);
    };
  }

  function startLevelUp(text) {
    lu.text = text;
    store.set('lutext', text);
    lu.analysis = window.Grammar.analyse(text);
    lu.units = window.LevelUp.findUnits(lu.analysis).map((u) => Object.assign(u, { chosen: null, tier: null }));
  }

  // the text of a unit as the pupil wrote it ("very big")
  function unitOriginal(u) {
    const ts = u.ids.map((i) => lu.analysis.tokens[i]);
    return ts.map((t, k) => (k ? ts[k - 1].post + t.pre : '') + t.text).join('');
  }
  function unitAt() {
    const map = new Map();
    lu.units.forEach((u) => u.ids.forEach((id, k) => map.set(id, { u, first: k === 0, last: k === u.ids.length - 1 })));
    return map;
  }

  /**
   * Build the levelled-up text. mode: 'html' (tappable words), 'after' (swaps highlighted), 'plain'.
   */
  function buildLevelUp(mode) {
    const tokens = lu.analysis.tokens;
    const at = unitAt();
    const out = [];
    let para = -1;
    const paraOf = new Map();
    lu.analysis.paragraphs.forEach((p, pi) => p.tokens.forEach((t) => paraOf.set(t.id, pi)));
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const p = paraOf.get(t.id);
      if (p !== para) {
        if (para !== -1) out.push(mode === 'plain' ? '\n' : '</p><p>');
        para = p;
      }
      const hit = at.get(i);
      if (hit && !hit.first) continue;
      if (hit) {
        const u = hit.u;
        const last = tokens[u.ids[u.ids.length - 1]];
        let shown = u.chosen || unitOriginal(u);
        let post = last.post;
        // fronted adverbials need a comma after them
        if (u.chosen && u.kind === 'fronted' && !/^\s*,/.test(post)) post = ',' + post;
        if (mode === 'plain') { out.push(t.pre + shown + post); continue; }
        const cls = u.chosen ? `swapped tier-${u.tier}` : 'plain';
        if (mode === 'after') {
          out.push(esc(t.pre) + (u.chosen ? `<mark class="swap">${esc(shown)}</mark>` : esc(shown)) + esc(post));
        } else {
          out.push(`${esc(t.pre)}<button class="lu-word ${cls}" data-unit="${lu.units.indexOf(u)}" aria-label="${esc(shown)}${u.chosen ? ', levelled up' : ', plain word – tap to level up'}">${esc(shown)}</button>${esc(post)}`);
        }
        shown = null;
        continue;
      }
      // a / an before a swapped word
      let text = t.text;
      const nextHit = at.get(i + 1);
      if (/^an?$/i.test(text) && nextHit && nextHit.first && nextHit.u.chosen) {
        const an = /^[aeiou]/i.test(nextHit.u.chosen) && !/^(uni|use|eu|one)/i.test(nextHit.u.chosen);
        text = (/^A/.test(text) ? 'A' : 'a') + (an ? 'n' : '');
      }
      if (mode === 'plain') { out.push(t.pre + text + t.post); continue; }
      if (mode === 'html' && ['noun', 'verb', 'adjective', 'adverb'].includes(t.cls) && /[a-z]/i.test(text)) {
        out.push(`${esc(t.pre)}<button class="lu-word other" data-tok="${i}">${esc(text)}</button>${esc(t.post)}`);
      } else {
        out.push(esc(t.pre + text + t.post));
      }
    }
    return mode === 'plain' ? out.join('').trim() : '<p>' + out.join('') + '</p>';
  }

  function renderLevelUpResult(level) {
    const plain = lu.units.filter((u) => !u.extra);
    const done = lu.units.filter((u) => u.chosen);
    const challenge = done.filter((u) => u.tier === 'challenge').length;
    const ambitious = done.filter((u) => u.tier === 'ambitious').length;
    const levelled = plain.filter((u) => u.chosen).length;
    let summary;
    if (!plain.length) {
      summary = '🌟 We didn’t spot any plain words. Great writing! You can still tap any word to look for an upgrade.';
    } else {
      const stars = plain.map((u) => (u.chosen ? '⭐' : '☆')).join('');
      summary = `<span class="stars" aria-hidden="true">${stars}</span> We found <strong>${plain.length}</strong> plain word${plain.length === 1 ? '' : 's'}. You’ve levelled up <strong>${levelled}</strong>!` +
        (levelled === plain.length ? ' 🎉 Every plain word has been upgraded!' : '');
    }
    const after = done.length ? buildLevelUp('after') : '';
    app.innerHTML = `
      ${luHead(level)}
      <div class="toolbar" role="toolbar" aria-label="Level up tools">
        <button class="btn small" id="lu-edit">✏️ Change writing</button>
        <span class="spacer"></span>
        <button class="btn small ghost" id="lu-hear">🔊 Read aloud</button>
        <button class="btn small ghost" id="lu-undo" ${done.length ? '' : 'disabled'}>↩️ Undo all</button>
      </div>
      <div class="lu-summary">${summary}
        ${level === 'upper' && done.length ? `<div class="small" style="margin-top:6px">🚀 ${challenge} challenge word${challenge === 1 ? '' : 's'} · ✨ ${ambitious} ambitious word${ambitious === 1 ? '' : 's'}</div>` : ''}
      </div>
      <p class="legend-hint" style="margin:12px 0">
        <span class="lu-key plain">plain word</span> Tap an underlined word to level it up.
        <span class="lu-key swapped">levelled up</span> Tap any other word to search for an upgrade.
      </p>
      <article class="reading lu-reading" id="lu-reading" lang="en">${buildLevelUp('html')}</article>
      ${done.length ? `
        <section class="card lu-compare">
          <div class="lu-before"><h3>Before</h3>${lu.analysis.paragraphs.filter((p) => !p.blank).map((p) => `<p>${esc(p.tokens.map((t) => t.pre + t.text + t.post).join(''))}</p>`).join('')}</div>
          <div class="lu-after"><h3>⚡ After</h3>${after}</div>
          <div class="input-actions">
            <button class="btn" id="lu-hear-new">🔊 Hear my new writing</button>
            <button class="btn" id="lu-copy">📋 Copy</button>
            <button class="btn primary" id="lu-save">⭐ Save new words to my word bank</button>
          </div>
        </section>` : ''}`;

    $('#lu-edit').onclick = () => { lu.editing = true; renderLevelUp(); $('#lu-in').focus(); };
    $('#lu-hear').onclick = () => speak(buildLevelUp('plain'));
    $('#lu-undo').onclick = () => {
      lu.units = lu.units.filter((u) => !u.extra);
      lu.units.forEach((u) => { u.chosen = null; u.tier = null; });
      renderLevelUp();
    };
    $('#lu-reading').addEventListener('click', (ev) => {
      const b = ev.target.closest('.lu-word');
      if (!b) return;
      if (b.dataset.unit != null) openLevelUpPicker(lu.units[+b.dataset.unit], level);
      else openApiPicker(+b.dataset.tok, level);
    });
    if (done.length) {
      $('#lu-hear-new').onclick = () => speak(buildLevelUp('plain'));
      $('#lu-copy').onclick = () => copyText(buildLevelUp('plain'));
      $('#lu-save').onclick = () => {
        const sentenceAfter = buildLevelUp('plain');
        done.forEach((u) => {
          const word = u.chosen.replace(/,$/, '');
          const sentence = sentenceFor(u, sentenceAfter);
          bank.add({ word: word.toLowerCase() === word ? word : word.charAt(0).toLowerCase() + word.slice(1), cls: u.cls, replaced: unitOriginal(u), sentence, definition: '', example: '', synonyms: [] });
        });
        toast(`⭐ ${done.length} new word${done.length === 1 ? '' : 's'} saved to your word bank`);
      };
    }
  }

  // the levelled-up sentence that contains a unit
  function sentenceFor(u, whole) {
    const parts = whole.match(/[^.!?]+[.!?]+["'”’]?|[^.!?]+$/g) || [whole];
    return (parts.find((s) => s.includes(u.chosen)) || whole).trim();
  }

  function copyText(text) {
    const done = () => toast('📋 Copied! You can paste it into your work.');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Sorry – copying isn’t allowed here.'); }
    ta.remove();
  }

  function luSentenceHtml(u) {
    const tokens = lu.analysis.tokens;
    const first = tokens[u.ids[0]];
    const ts = tokens.filter((t) => t.sentence === first.sentence);
    return ts.map((t, k) => {
      const text = (k ? t.pre : '') + t.text + (k === ts.length - 1 ? t.post.trimEnd() : t.post);
      return u.ids.includes(tokens.indexOf(t)) ? `<mark class="c-${u.cls}">${esc(text.trim())}</mark>${/\s$/.test(text) ? ' ' : ''}` : esc(text);
    }).join('');
  }

  function pickerHtml(u, title, why, groups, loading) {
    const cls = u.cls;
    return `
      <div class="modal-head">
        <div>
          <h2 id="modal-title">${esc(title)}</h2>
          ${badge(cls, clsInfo(cls).label)}
        </div>
        <button class="close" data-close aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        ${why ? `<section class="note">💡 ${esc(why)}</section>` : ''}
        <section>
          <h3>📝 In your writing</h3>
          <div class="context">${luSentenceHtml(u)}</div>
        </section>
        <section id="lu-options">
          ${loading ? '<div class="loading"><span class="spinner"></span> Finding better words…</div>' : optionGroups(groups)}
        </section>
      </div>
      <div class="modal-foot">
        <button class="btn" id="lu-hear-word">🔊 Hear it</button>
        <button class="btn" id="lu-keep" aria-label="Keep “${esc(unitOriginal(u))}”">↩️ Keep my word</button>
      </div>`;
  }

  function optionGroups(groups) {
    if (!groups.length || !groups.some((g) => g.words.length)) {
      return '<p class="muted">We couldn’t find any upgrades for this word. Sometimes the word you have is already the best one!</p>';
    }
    return groups.filter((g) => g.words.length).map((g) => `
      <h3>${LU_TIER[g.tier][0]} ${LU_TIER[g.tier][1] ? `<span class="muted small" style="font-weight:400">– ${LU_TIER[g.tier][1]}</span>` : ''}</h3>
      <div class="lu-options">${g.words.map((w) => `<button class="lu-opt tier-${g.tier}" data-word="${esc(w)}" data-tier="${g.tier}">${esc(w)}</button>`).join('')}</div>`).join('');
  }

  function wirePicker(modal, u) {
    $('#lu-hear-word', modal).onclick = () => speak(u.chosen || unitOriginal(u));
    $('#lu-keep', modal).onclick = () => {
      u.chosen = null; u.tier = null;
      if (u.extra) lu.units.splice(lu.units.indexOf(u), 1);
      closeModal();
      renderLevelUp();
    };
    $('#lu-options', modal).addEventListener('click', (ev) => {
      const b = ev.target.closest('.lu-opt');
      if (!b) return;
      const before = unitOriginal(u);
      u.chosen = b.dataset.word;
      u.tier = b.dataset.tier;
      if (u.extra && !lu.units.includes(u)) lu.units.push(u);
      closeModal();
      renderLevelUp();
      toast(`⚡ ${before} → ${u.chosen}`);
    });
  }

  function openLevelUpPicker(u, level) {
    const first = lu.analysis.tokens[u.ids[0]];
    const capital = /^[A-Z]/.test(first.text);
    const groups = window.LevelUp.suggestions(u, level, window.Grammar.inflect, capital);
    const e = window.LevelUp.ENTRIES[u.key];
    const why = u.kind === 'very'
      ? `Instead of “${unitOriginal(u)}”, use ONE powerful word. It makes your writing sharper!`
      : e.why;
    const modal = openModal(pickerHtml(u, unitOriginal(u), why, groups), u.cls);
    wirePicker(modal, u);
  }

  // any other word: look for synonyms online
  function openApiPicker(i, level) {
    const t = lu.analysis.tokens[i];
    const existing = lu.units.find((x) => x.ids.includes(i));
    if (existing) { openLevelUpPicker(existing, level); return; }
    const ex = window.Grammar.explain(lu.analysis, t);
    const u = { ids: [i], key: null, cls: t.cls, form: ex.form, kind: 'extra', extra: true, chosen: null, tier: null };
    const capital = /^[A-Z]/.test(t.text);
    const modal = openModal(pickerHtml(u, t.text, '', [], true), t.cls);
    wirePicker(modal, u);
    const fix = (w) => window.LevelUp.shape(w, ex.form, window.Grammar.inflect, capital);
    const word = ex.lookup || t.text.toLowerCase();
    const req = level === 'upper'
      ? window.Lookup.richSynonyms(word, t.cls).then((list) => {
        const by = (tier) => list.filter((x) => x.tier === tier).slice(0, 10).map((x) => fix(x.word));
        const groups = [{ tier: 'challenge', words: by('challenge') }, { tier: 'ambitious', words: by('ambitious') }];
        if (!groups[0].words.length && !groups[1].words.length) groups.push({ tier: 'lower', words: by('everyday') });
        return groups;
      })
      : window.Lookup.synonyms(word, t.cls).then((list) => [{ tier: 'lower', words: list.slice(0, 8).map(fix) }]);
    req.then((groups) => {
      const box = $('#lu-options', modal);
      if (!box || !modal.isConnected) return;
      groups.forEach((g) => { g.words = Array.from(new Set(g.words)).filter((w) => w.toLowerCase() !== t.text.toLowerCase()); });
      box.innerHTML = optionGroups(groups);
    }).catch(() => {
      const box = $('#lu-options', modal);
      if (box) box.innerHTML = offlineMsg();
    });
  }

  // ================================================================ BANK
  let bankFilter = '';
  let bankSearch = '';
  function renderBank() {
    document.title = 'My Word Bank · What’s That Word?';
    const all = bank.all();
    const classes = ORDER.filter((c) => all.some((e) => e.cls === c));
    const list = all.filter((e) => (!bankFilter || e.cls === bankFilter) &&
      (!bankSearch || e.word.toLowerCase().includes(bankSearch.toLowerCase())));

    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">⭐ My collection</p>
          <h1>My Word <em>Bank</em></h1>
        </div>
        ${all.length ? `<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn small" id="print-bank">🖨️ Print</button>
          <button class="btn small ghost" id="clear-bank">Empty word bank</button>
        </div>` : ''}
      </div>
      ${all.length ? `
        <div class="bank-tools">
          <input type="search" id="bank-search" placeholder="Find a word…" value="${esc(bankSearch)}" aria-label="Find a word in my word bank">
          <div class="chips">
            <button class="chip ${!bankFilter ? 'c-other' : ''}" data-f="" style="${!bankFilter ? 'border-color:var(--ink)' : ''}">All (${all.length})</button>
            ${classes.map((c) => `<button class="chip" data-f="${c}" style="${bankFilter === c ? `background:var(--${c});border-color:var(--${c}-line)` : ''}"><span class="swatch c-${c}"></span>${esc(CLASSES[c].label)}s</button>`).join('')}
          </div>
        </div>
        <div class="bank-grid">${list.map(bankCard).join('') || '<p class="muted">No words match.</p>'}</div>` : `
        <div class="card empty">
          <div class="big" aria-hidden="true">🌱</div>
          <h2>Your word bank is empty</h2>
          <p class="muted">When you find a word you love, tap <strong>☆ Add to word bank</strong> on its card and it will be saved here.</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
            <a class="btn primary" href="#/grammar">✏️ Grammar Corner</a>
            <a class="btn" href="#/vocab">📖 Vocabulary Corner</a>
          </div>
        </div>`}
      <p class="small muted" style="margin-top:24px">Your word bank is saved on this device, in this browser.</p>`;

    $$('[data-f]').forEach((b) => { b.onclick = () => { bankFilter = b.dataset.f; renderBank(); }; });
    const s = $('#bank-search');
    if (s) s.oninput = () => {
      bankSearch = s.value;
      const pos = s.selectionStart;
      renderBank();
      const s2 = $('#bank-search'); s2.focus(); s2.setSelectionRange(pos, pos);
    };
    const p = $('#print-bank'); if (p) p.onclick = () => window.print();
    const c = $('#clear-bank');
    if (c) c.onclick = () => {
      if (confirm('Remove every word from your word bank? This can’t be undone.')) { store.set('bank', []); updateCount(); renderBank(); }
    };
    $$('[data-remove]').forEach((b) => {
      b.onclick = () => {
        const [w, cl] = JSON.parse(b.dataset.remove);
        bank.remove(w, cl);
        toast(`Removed “${w}”`);
        renderBank();
      };
    });
    $$('[data-say]').forEach((b) => { b.onclick = () => speak(b.dataset.say); });
  }

  function bankCard(e) {
    const date = e.added ? new Date(e.added).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
    return `
      <article class="card bank-card c-${esc(e.cls)}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          ${badge(e.cls, e.sub ? cap(e.sub) : clsInfo(e.cls).label)}
          <span class="date">${esc(date)}</span>
        </div>
        <h3>${esc(e.word)}</h3>
        ${e.definition ? `<p class="def">${esc(e.definition)}</p>` : ''}
        ${e.sentence ? `<p class="ctx">“${highlightInSentence(e.sentence, e.word, e.cls)}”</p>` : e.example ? `<p class="ctx">“${esc(e.example)}”</p>` : ''}
        ${e.replaced ? `<p class="syn"><strong>⚡ Levelled up from:</strong> ${esc(e.replaced)}</p>` : ''}
        ${e.synonyms && e.synonyms.length ? `<p class="syn"><strong>Synonyms:</strong> ${esc(e.synonyms.join(', '))}</p>` : ''}
        <div class="row">
          <button class="btn small" data-say="${esc(e.word)}">🔊 Hear it</button>
          ${e.cls !== 'propernoun' ? `<a class="btn small" href="#/vocab/${encodeURIComponent(e.word)}">📖 Look up</a>` : ''}
          <button class="btn small ghost" data-remove='${esc(JSON.stringify([e.word, e.cls]))}' aria-label="Remove ${esc(e.word)}">🗑️</button>
        </div>
      </article>`;
  }

  // ------------------------------------------------------------ start
  updateCount();
  applyFont();
  route();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
