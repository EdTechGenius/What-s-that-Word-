/*
 * app.js — the What's That Word? interface.
 * Pages (hash routes):
 *   #/           home – choose an area
 *   #/grammar    Glorious Grammar – colour-coded text, tap a word for its card
 *   #/vocab/word Vivid Vocabulary – dictionary + thesaurus
 *   #/levelup    Level Up! – improve a piece of writing
 *   #/figurative Figurative Language – techniques and examples
 *   #/peat       Alan Peat Sentences – sentence types
 *   #/notebook   My Notebook – word bank + sentences
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
  const FIG_INFO = { label: 'Figurative language', short: 'Fig', emoji: '🎨', kid: '' };
  const PEAT_INFO = { label: 'Alan Peat sentence', short: 'AP', emoji: '🧱', kid: '' };
  const EXTRA_INFO = {
    figurative: FIG_INFO, peat: PEAT_INFO,
    levelup: { label: 'Levelled-up writing', short: 'LU', emoji: '⚡', kid: '' },
    own: { label: 'My sentence', short: '✍️', emoji: '✍️', kid: '' },
  };
  const clsInfo = (cls) => EXTRA_INFO[cls] || CLASSES[cls] || CLASSES.other;
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

  // ------------------------------------------------------------ notebook (stored as 'bank')
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
      ${saved ? '✓ In my notebook' : '☆ Add to notebook'}</button>`;
  }
  // one listener handles every "add to notebook" button
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-bank]');
    if (!btn) return;
    const entry = JSON.parse(btn.getAttribute('data-bank'));
    if (bank.has(entry.word, entry.cls)) {
      bank.remove(entry.word, entry.cls);
      btn.classList.remove('saved');
      btn.innerHTML = '☆ Add to notebook';
      toast(`Removed from your notebook`);
    } else {
      bank.add(entry);
      btn.classList.add('saved');
      btn.innerHTML = '✓ In my notebook';
      toast(entry.word.length > 30 ? '📓 Added to your notebook' : `📓 “${entry.word}” added to your notebook`);
    }
    if (location.hash.startsWith('#/notebook')) renderNotebook(location.hash.split('/')[2]);
  });

  // ------------------------------------------------------------ router
  function route() {
    closeModal();
    app.onclick = null;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const page = parts[0] || '';
    const arg = parts.slice(1).join('/');
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === page));
    window.scrollTo(0, 0);
    if (page === 'grammar') renderGrammar();
    else if (page === 'vocab') renderVocab(decodeURIComponent(arg || ''));
    else if (page === 'levelup') renderLevelUp();
    else if (page === 'figurative') renderFigurative(decodeURIComponent(arg || ''));
    else if (page === 'peat') renderPeat(decodeURIComponent(arg || ''));
    else if (page === 'notebook') renderNotebook(arg);
    else if (page === 'bank') { location.replace('#/notebook'); return; }
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
        <p class="lead">Explore any text word by word. See every word class in colour, find out what words mean, and collect brilliant words and sentences in your own notebook.</p>
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
      <section class="corners" aria-label="Choose an area">
        <a class="corner grammar" href="#/grammar">
          <span class="corner-icon" aria-hidden="true">✏️</span>
          <h2>Glorious Grammar</h2>
          <div class="sample" aria-hidden="true">${sample.map(([w, c]) => `<span class="c-${c}">${w}</span>`).join('')}</div>
          <p>Type or paste any text. Every word lights up in the colour of its word class. Tap a word to find out what it is, why, and what it means.</p>
          <span class="go">Start exploring →</span>
        </a>
        <a class="corner vocab" href="#/vocab">
          <span class="corner-icon" aria-hidden="true">📖</span>
          <h2>Vivid Vocabulary</h2>
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
        <a class="corner figurative" href="#/figurative">
          <span class="corner-icon" aria-hidden="true">🎨</span>
          <h2>Figurative Language</h2>
          <div class="sample" aria-hidden="true"><span class="fig-demo">as quiet as a mouse</span><span class="fig-demo">Crash!</span></div>
          <p>Similes, metaphors, personification and more, each with examples, what they mean and when to use them.</p>
          <span class="go">Explore techniques →</span>
        </a>
        <a class="corner peat" href="#/peat">
          <span class="corner-icon" aria-hidden="true">🧱</span>
          <h2>Alan Peat Sentences</h2>
          <div class="sample" aria-hidden="true"><span class="peat-demo">2A</span><span class="peat-demo">, BOYS</span><span class="peat-demo">3 ___ed,</span></div>
          <p>All the sentence types in one place: how each one works, examples, and your own sentences with a checklist.</p>
          <span class="go">Build sentences →</span>
        </a>
        <a class="corner bank" href="#/notebook">
          <span class="corner-icon" aria-hidden="true">📓</span>
          <h2>My Notebook</h2>
          <div class="sample" aria-hidden="true"><span class="nb-demo">📖 Word bank</span><span class="nb-demo">✍️ Sentences</span></div>
          <p>Your word bank of interesting words, plus all the brilliant sentences you have written and saved.</p>
          <span class="go">Open my notebook →</span>
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
    document.title = 'Glorious Grammar · What’s That Word?';
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
          <p class="eyebrow">✏️ Word classes in colour</p>
          <h1>Glorious <em>Grammar</em></h1>
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
          <p class="eyebrow">✏️ Glorious Grammar</p>
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
             <p class="source">Tap a synonym to explore it in Vivid Vocabulary.</p>`
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
    document.title = 'Vivid Vocabulary · What’s That Word?';
    const level = store.get('level', null);
    if (!LEVELS[level]) { renderLevelChoice(word); return; }
    const recent = store.get('recent', []);
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">📖 Dictionary and thesaurus</p>
          <h1>Vivid <em>Vocabulary</em></h1>
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
          <p class="eyebrow">${isLU ? '⚡ Improve your writing' : '📖 Dictionary and thesaurus'}</p>
          <h1>${isLU ? 'Level <em>Up!</em>' : 'Vivid <em>Vocabulary</em>'}</h1>
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
    { title: 'At the park', text: 'It was a nice day so we went to the park. The big dog ran fast. I was very happy.' },
    { title: 'The spooky house', text: '"Who is there?" said Sam. He walked into the dark house. It was very cold. He was scared. Then he saw a strange thing on the floor.' },
    { title: 'Lunch time', text: 'I was very hungry. I ate my sandwich quickly. It was really good. Then I got a small cake and we had fun.' },
  ];
  const LU_TIER = {
    lower: ['⭐ Try one of these', ''],
    ambitious: ['✨ Ambitious', 'great for upgrading your writing'],
    challenge: ['🚀 Challenge', 'rare and impressive'],
  };
  const LU_MODES = {
    swap: {
      label: '🔁 Swap words',
      tip: { lower: 'Tap an underlined plain word and swap it for a more exciting one.', upper: 'Tap an underlined plain word and swap it for an ambitious or challenge word. Phrases like “very big” become one powerful word.' },
    },
    adverb: {
      label: '➕ Add adverbs',
      tip: { lower: 'An <strong>adverb</strong> tells us HOW something happens, like <em>quickly</em> or <em>quietly</em>. Tap a ＋ to add one next to a verb.', upper: 'An <strong>adverb</strong> shows exactly HOW an action happens. Choose one that fits the mood, but don’t overdo it: one adverb in a sentence is usually plenty! Tap a ＋ to add one.' },
    },
    opener: {
      label: '🎬 Sentence openers',
      tip: { lower: 'A <strong>sentence opener</strong> tells us WHEN, WHERE or HOW something happened. Tap a ＋ at the start of a sentence. Don’t forget the comma!', upper: 'A <strong>fronted adverbial</strong> is a word or phrase at the start of a sentence that tells us when, where or how. It is followed by a comma. Using different openers makes your writing flow. Tap a ＋ to add one.' },
    },
    conj: {
      label: '🔗 Conjunctions',
      tip: { lower: '<strong>Conjunctions</strong> are joining words like <em>and</em>, <em>but</em>, <em>so</em> and <em>because</em>. Tap a ＋ to join two sentences or to add more to a sentence.', upper: '<strong>Coordinating conjunctions</strong> (FANBOYS) join two equal clauses. <strong>Subordinating conjunctions</strong> (because, although, while…) add a subordinate clause with extra information. Tap a ＋ to join sentences or extend one.' },
    },
  };
  const lu = {
    text: store.get('lutext', ''),
    analysis: null,
    units: [],
    adds: { adverb: {}, opener: {}, conj: {} },
    slots: { adverb: {}, opener: {}, conj: {} },
    mode: 'swap',
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
          <p class="eyebrow">⚡ Improve your writing</p>
          <h1>Level <em>Up!</em></h1>
        </div>
        ${levelSwitch(level)}
      </div>`;
  }

  function renderLevelUpInput(level) {
    app.innerHTML = `
      ${luHead(level)}
      <p class="lead">Type or paste your writing, then level it up in four ways: <strong>swap plain words</strong>, <strong>add adverbs</strong>, <strong>add sentence openers</strong> and <strong>join sentences with conjunctions</strong>.${level === 'upper' ? ' You’ll get ✨ ambitious and 🚀 challenge choices.' : ''}</p>
      <div class="card input-card">
        <textarea id="lu-in" placeholder="Type or paste your writing here…" spellcheck="true">${esc(lu.text)}</textarea>
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
    lu.adds = { adverb: {}, opener: {}, conj: {} };
    lu.slots = {
      adverb: window.LevelUp.adverbSlots(lu.analysis),
      opener: window.LevelUp.openerSlots(lu.analysis),
      conj: window.LevelUp.conjunctionSlots(lu.analysis),
    };
  }

  // the text of a unit as the pupil wrote it ("very big")
  function unitOriginal(u) {
    const ts = u.ids.map((i) => lu.analysis.tokens[i]);
    return ts.map((t, k) => (k ? ts[k - 1].post + t.pre : '') + t.text).join('');
  }
  function unitAt() {
    const map = new Map();
    lu.units.forEach((u) => u.ids.forEach((id, k) => map.set(id, { u, first: k === 0 })));
    return map;
  }
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Is a sentence joined onto the one before it?
  function joinedInto(s) {
    return Object.keys(lu.adds.conj).some((k) => lu.adds.conj[k].kind === 'join' && lu.slots.conj[k] && lu.slots.conj[k].next === s);
  }

  /**
   * Build the levelled-up writing.
   * mode: 'html' (tappable, for the current way), 'after' (changes highlighted), 'plain' (text only).
   */
  function buildLevelUp(mode) {
    const tokens = lu.analysis.tokens;
    const at = unitAt();
    const html = mode !== 'plain';
    const e = (s) => (html ? esc(s) : s);
    const firstOf = {};
    const lastOf = {};
    tokens.forEach((t, i) => {
      if (!/[a-z0-9]/i.test(t.text)) return;
      if (firstOf[t.sentence] == null) firstOf[t.sentence] = i;
      lastOf[t.sentence] = i;
    });
    const added = (kind, key, text, tier) => {
      if (mode === 'plain') return text;
      if (mode === 'after') return `<mark class="add">${esc(text)}</mark>`;
      return `<button class="lu-added add-${kind} tier-${tier || 'lower'}" data-add="${kind}:${key}">${esc(text)}</button>`;
    };
    const plus = (kind, key, label) => `<button class="lu-plus plus-${kind}" data-slot="${kind}:${key}" aria-label="${esc(label)}">＋</button>`;
    const paraOf = new Map();
    lu.analysis.paragraphs.forEach((p, pi) => p.tokens.forEach((t) => paraOf.set(t.id, pi)));

    const out = [];
    let para = -1;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const s = t.sentence;
      const p = paraOf.get(t.id);
      if (p !== para) {
        if (para !== -1) out.push(mode === 'plain' ? '\n' : '</p><p>');
        para = p;
      }
      const hit = at.get(i);
      if (hit && !hit.first) continue;

      // ---- the word itself (a swap unit or a single token)
      let pre = t.pre;
      let post = t.post;
      let core;
      const startI = i;
      const isFirstWord = i === firstOf[s];
      const opener = lu.adds.opener[s] && !joinedInto(s) ? lu.adds.opener[s] : null;
      const lower = isFirstWord && (opener || joinedInto(s)) && t.text !== 'I' && !/^I[’']/.test(t.text) && t.cls !== 'propernoun';
      if (hit) {
        const u = hit.u;
        const last = tokens[u.ids[u.ids.length - 1]];
        post = last.post;
        let shown = u.chosen || unitOriginal(u);
        if (lower) shown = lowerFirst(shown);
        if (u.chosen && u.kind === 'fronted' && !/^\s*,/.test(post)) post = ',' + post;
        if (mode === 'plain') core = shown;
        else if (mode === 'after') core = u.chosen ? `<mark class="swap">${esc(shown)}</mark>` : esc(shown);
        else if (u.chosen) core = `<button class="lu-word swapped tier-${u.tier}" data-unit="${lu.units.indexOf(u)}">${esc(shown)}</button>`;
        else if (lu.mode === 'swap') core = `<button class="lu-word plain" data-unit="${lu.units.indexOf(u)}" aria-label="${esc(shown)}, plain word – tap to level up">${esc(shown)}</button>`;
        else core = esc(shown);
        i = u.ids[u.ids.length - 1];
      } else {
        let text = t.text;
        if (lower) text = lowerFirst(text);
        const nextHit = at.get(i + 1);
        if (/^an?$/i.test(text) && nextHit && nextHit.first && nextHit.u.chosen) {
          const an = /^[aeiou]/i.test(nextHit.u.chosen) && !/^(uni|use|eu|one)/i.test(nextHit.u.chosen);
          text = (/^A/.test(text) ? 'A' : 'a') + (an ? 'n' : '');
        }
        if (mode === 'html' && lu.mode === 'swap' && ['noun', 'verb', 'adjective', 'adverb'].includes(t.cls) && /[a-z]/i.test(text)) {
          core = `<button class="lu-word other" data-tok="${i}">${esc(text)}</button>`;
        } else core = e(text);
      }
      const endI = i;   // last token covered by this word

      // ---- sentence opener (before the first word)
      let before = '';
      if (isFirstWord && !joinedInto(s)) {
        if (opener) before = added('opener', s, opener.text, opener.tier) + e(', ');
        else if (mode === 'html' && lu.mode === 'opener' && lu.slots.opener[s] != null) before = plus('opener', s, 'Add a sentence opener');
      }
      // ---- adverb before/after a verb
      const advSlot = lu.slots.adverb[s];
      const adv = lu.adds.adverb[s];
      let advBefore = '';
      let advAfter = '';
      if (advSlot && advSlot.at >= startI && advSlot.at <= endI) {
        if (adv) {
          if (advSlot.pos === 'before') advBefore = added('adverb', s, adv.word, adv.tier) + e(' ');
          else advAfter = e(' ') + added('adverb', s, adv.word, adv.tier);
        } else if (mode === 'html' && lu.mode === 'adverb') {
          if (advSlot.pos === 'before') advBefore = plus('adverb', s, 'Add an adverb') + ' ';
          else advAfter = ' ' + plus('adverb', s, 'Add an adverb');
        }
      }
      // ---- conjunction at the end of a sentence
      let conjHtml = '';
      const cSlot = lu.slots.conj[s];
      if (cSlot && cSlot.last === endI) {
        const c = lu.adds.conj[s];
        if (c) {
          const comma = window.LevelUp.COMMA_BEFORE.includes(c.conj) ? ',' : '';
          if (c.kind === 'join') {
            post = post.replace(/^\.\s*/, '');
            conjHtml = e(comma + ' ') + added('conj', s, c.conj, c.tier) + e(' ');
          } else {
            conjHtml = e(comma + ' ') + added('conj', s, `${c.conj} ${c.clause}`, c.tier);
          }
        } else if (mode === 'html' && lu.mode === 'conj') {
          conjHtml = ' ' + plus('conj', s, 'Add a conjunction');
        }
      }
      out.push(e(pre) + before + advBefore + core + advAfter + conjHtml + e(post));
    }
    const joined = out.join('');
    return mode === 'plain' ? joined.replace(/[ \t]+\n/g, '\n').trim() : '<p>' + joined + '</p>';
  }

  function luCounts() {
    const plain = lu.units.filter((u) => !u.extra);
    return {
      plain,
      swaps: lu.units.filter((u) => u.chosen).length,
      levelled: plain.filter((u) => u.chosen).length,
      adverb: Object.keys(lu.adds.adverb).length,
      opener: Object.keys(lu.adds.opener).filter((s) => !joinedInto(+s)).length,
      conj: Object.keys(lu.adds.conj).length,
      tiers: [].concat(lu.units.filter((u) => u.chosen).map((u) => u.tier),
        ...['adverb', 'opener', 'conj'].map((k) => Object.values(lu.adds[k]).map((a) => a.tier))),
    };
  }

  function renderLevelUpResult(level) {
    const c = luCounts();
    const changes = c.swaps + c.adverb + c.opener + c.conj;
    const challenge = c.tiers.filter((x) => x === 'challenge').length;
    const ambitious = c.tiers.filter((x) => x === 'ambitious').length;
    const slotCount = {
      swap: c.plain.length,
      adverb: Object.keys(lu.slots.adverb).length,
      opener: Object.keys(lu.slots.opener).length,
      conj: Object.keys(lu.slots.conj).length,
    };
    const doneCount = { swap: c.levelled, adverb: c.adverb, opener: c.opener, conj: c.conj };
    const stars = c.plain.length ? c.plain.map((u) => (u.chosen ? '⭐' : '☆')).join('') : '';

    app.innerHTML = `
      ${luHead(level)}
      <div class="toolbar" role="toolbar" aria-label="Level up tools">
        <button class="btn small" id="lu-edit">✏️ Change writing</button>
        <span class="spacer"></span>
        <button class="btn small ghost" id="lu-hear">🔊 Read aloud</button>
        <button class="btn small ghost" id="lu-undo" ${changes ? '' : 'disabled'}>↩️ Undo all</button>
      </div>
      <div class="lu-modes" role="tablist" aria-label="Ways to level up">
        ${Object.keys(LU_MODES).map((m) => `<button role="tab" aria-selected="${lu.mode === m}" data-mode="${m}">${LU_MODES[m].label}
          <span class="lu-count">${doneCount[m]}${slotCount[m] ? '/' + slotCount[m] : ''}</span></button>`).join('')}
      </div>
      <p class="lu-tip">💡 ${LU_MODES[lu.mode].tip[level]}</p>
      <div class="lu-summary">
        ${lu.mode === 'swap' ? (c.plain.length
          ? `<span class="stars" aria-hidden="true">${stars}</span> We found <strong>${c.plain.length}</strong> plain word${c.plain.length === 1 ? '' : 's'}. You’ve levelled up <strong>${c.levelled}</strong>!${c.levelled === c.plain.length ? ' 🎉' : ''}`
          : '🌟 No plain words found. Great writing! You can still tap any word to look for an upgrade.')
          : slotCount[lu.mode] ? `Tap a <span class="lu-plus-demo">＋</span> to add ${{ adverb: 'an adverb', opener: 'a sentence opener', conj: 'a conjunction' }[lu.mode]}. ${doneCount[lu.mode] ? `You’ve added <strong>${doneCount[lu.mode]}</strong> so far!` : ''}`
            : `There’s nowhere obvious to add ${{ adverb: 'an adverb', opener: 'a sentence opener', conj: 'a conjunction' }[lu.mode]} in this writing. Try another way to level up!`}
        ${changes ? `<div class="lu-tally">🔁 ${c.swaps} swapped · ➕ ${c.adverb} adverb${c.adverb === 1 ? '' : 's'} · 🎬 ${c.opener} opener${c.opener === 1 ? '' : 's'} · 🔗 ${c.conj} conjunction${c.conj === 1 ? '' : 's'}${level === 'upper' ? ` <span class="muted">· 🚀 ${challenge} challenge · ✨ ${ambitious} ambitious</span>` : ''}</div>` : ''}
      </div>
      <article class="reading lu-reading mode-${lu.mode}" id="lu-reading" lang="en">${buildLevelUp('html')}</article>
      ${changes ? `
        <section class="card lu-compare">
          <div class="lu-before"><h3>Before</h3>${lu.analysis.paragraphs.filter((p) => !p.blank).map((p) => `<p>${esc(p.tokens.map((t) => t.pre + t.text + t.post).join(''))}</p>`).join('')}</div>
          <div class="lu-after"><h3>⚡ After</h3>${buildLevelUp('after')}</div>
          <div class="input-actions">
            <button class="btn" id="lu-hear-new">🔊 Hear my new writing</button>
            <button class="btn" id="lu-copy">📋 Copy</button>
            <button class="btn primary" id="lu-save">📓 Save to my notebook</button>
          </div>
        </section>` : ''}`;

    $('#lu-edit').onclick = () => { lu.editing = true; renderLevelUp(); $('#lu-in').focus(); };
    $('#lu-hear').onclick = () => speak(buildLevelUp('plain'));
    $('#lu-undo').onclick = () => {
      if (!confirm('Undo all your changes?')) return;
      lu.units = lu.units.filter((u) => !u.extra);
      lu.units.forEach((u) => { u.chosen = null; u.tier = null; });
      lu.adds = { adverb: {}, opener: {}, conj: {} };
      renderLevelUp();
    };
    $$('[data-mode]').forEach((b) => { b.onclick = () => { lu.mode = b.dataset.mode; renderLevelUp(); }; });
    $('#lu-reading').addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.unit != null) openLevelUpPicker(lu.units[+b.dataset.unit], level);
      else if (b.dataset.tok != null) openApiPicker(+b.dataset.tok, level);
      else if (b.dataset.slot || b.dataset.add) {
        const [kind, s] = (b.dataset.slot || b.dataset.add).split(':');
        openAddPicker(kind, +s, level);
      }
    });
    if (changes) {
      $('#lu-hear-new').onclick = () => speak(buildLevelUp('plain'));
      $('#lu-copy').onclick = () => copyText(buildLevelUp('plain'));
      $('#lu-save').onclick = () => {
        const whole = buildLevelUp('plain');
        const done = lu.units.filter((u) => u.chosen);
        done.forEach((u) => {
          const word = u.chosen.replace(/,$/, '');
          bank.add({ word: word.toLowerCase() === word ? word : lowerFirst(word), cls: u.cls, replaced: unitOriginal(u), sentence: sentenceFor(u.chosen, whole), definition: '', example: '', synonyms: [] });
        });
        Object.values(lu.adds.adverb).forEach((a) => {
          bank.add({ word: a.word, cls: 'adverb', sentence: sentenceFor(a.word, whole), definition: '', example: '', synonyms: [] });
        });
        const original = lu.analysis.paragraphs.filter((p) => !p.blank).map((p) => p.tokens.map((t) => t.pre + t.text + t.post).join('').trim()).join('\n');
        bank.add({ word: whole, cls: 'levelup', kind: 'sentence', sub: 'Levelled-up writing', replaced: original, definition: '', example: '', sentence: '', synonyms: [] });
        const n = done.length + Object.keys(lu.adds.adverb).length;
        toast(`📓 Your writing${n ? ` and ${n} new word${n === 1 ? '' : 's'}` : ''} saved to your notebook`);
      };
    }
  }

  // the levelled-up sentence that contains a word
  function sentenceFor(word, whole) {
    const parts = whole.match(/[^.!?]+[.!?]+["'”’]?|[^.!?]+$/g) || [whole];
    return (parts.find((s) => s.includes(word)) || whole).trim();
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

  // a sentence of the original writing with some tokens highlighted
  function luSentenceHtml(s, markIds, cls) {
    const tokens = lu.analysis.tokens;
    const ts = tokens.map((t, i) => [t, i]).filter(([t]) => t.sentence === s);
    return ts.map(([t, i], k) => {
      const pre = k ? t.pre : t.pre.replace(/^\s+/, '');
      const post = k === ts.length - 1 ? t.post.trimEnd() : t.post;
      return esc(pre) + (markIds.includes(i) ? `<mark class="c-${cls}">${esc(t.text)}</mark>` : esc(t.text)) + esc(post);
    }).join('');
  }

  function optionGroups(groups, attr) {
    if (!groups.length || !groups.some((g) => g.words.length)) {
      return '<p class="muted">We couldn’t find any upgrades for this word. Sometimes the word you have is already the best one!</p>';
    }
    return groups.filter((g) => g.words.length).map((g) => `
      <h3>${g.title || LU_TIER[g.tier][0]} ${!g.title && LU_TIER[g.tier][1] ? `<span class="muted small" style="font-weight:400">– ${LU_TIER[g.tier][1]}</span>` : ''}</h3>
      <div class="lu-options">${g.words.map((w) => `<button class="lu-opt tier-${g.tier}" data-${attr || 'word'}="${esc(w)}" data-tier="${g.tier}">${esc(w)}</button>`).join('')}</div>`).join('');
  }

  function pickerShell(title, cls, badgeText, why, context, body, foot) {
    return `
      <div class="modal-head">
        <div>
          <h2 id="modal-title">${esc(title)}</h2>
          ${badge(cls, badgeText)}
        </div>
        <button class="close" data-close aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        ${why ? `<section class="note">💡 ${why}</section>` : ''}
        ${context ? `<section><h3>📝 In your writing</h3><div class="context">${context}</div></section>` : ''}
        <section id="lu-options">${body}</section>
      </div>
      <div class="modal-foot">${foot}</div>`;
  }

  // ---- swapping a word
  function wireSwapPicker(modal, u) {
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
  const swapFoot = (u) => `<button class="btn" id="lu-hear-word">🔊 Hear it</button>
    <button class="btn" id="lu-keep" aria-label="Keep “${esc(unitOriginal(u))}”">↩️ Keep my word</button>`;

  function openLevelUpPicker(u, level) {
    const first = lu.analysis.tokens[u.ids[0]];
    const groups = window.LevelUp.suggestions(u, level, window.Grammar.inflect, /^[A-Z]/.test(first.text));
    const e = window.LevelUp.ENTRIES[u.key];
    const why = u.kind === 'very'
      ? `Instead of “${esc(unitOriginal(u))}”, use ONE powerful word. It makes your writing sharper!`
      : esc(e ? e.why : '');
    const modal = openModal(pickerShell(unitOriginal(u), u.cls, clsInfo(u.cls).label, why,
      luSentenceHtml(first.sentence, u.ids, u.cls), optionGroups(groups), swapFoot(u)), u.cls);
    wireSwapPicker(modal, u);
  }

  // any other word: look for synonyms online
  function openApiPicker(i, level) {
    const t = lu.analysis.tokens[i];
    const existing = lu.units.find((x) => x.ids.includes(i));
    if (existing) { openLevelUpPicker(existing, level); return; }
    const ex = window.Grammar.explain(lu.analysis, t);
    const u = { ids: [i], key: null, cls: t.cls, form: ex.form, kind: 'extra', extra: true, chosen: null, tier: null };
    const capital = /^[A-Z]/.test(t.text);
    const modal = openModal(pickerShell(t.text, t.cls, clsInfo(t.cls).label, '', luSentenceHtml(t.sentence, [i], t.cls),
      '<div class="loading"><span class="spinner"></span> Finding better words…</div>', swapFoot(u)), t.cls);
    wireSwapPicker(modal, u);
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

  // ---- adding an adverb, opener or conjunction
  function openAddPicker(kind, s, level) {
    const LU = window.LevelUp;
    const tokens = lu.analysis.tokens;
    const existing = lu.adds[kind][s];
    const removeBtn = existing ? `<button class="btn" id="lu-remove">🗑️ Remove “${esc(kind === 'conj' ? existing.conj : existing.word || existing.text)}”</button>` : '<button class="btn" data-close>Not now</button>';
    const foot = `<button class="btn" id="lu-hear-sentence">🔊 Hear my writing</button>${removeBtn}`;
    let modal;

    if (kind === 'adverb') {
      const slot = lu.slots.adverb[s];
      const verb = tokens[slot.verb];
      const verbUnit = lu.units.find((u) => u.ids.includes(slot.verb) && u.chosen);
      const verbText = verbUnit ? verbUnit.chosen : verb.text;
      const groups = LU.adverbsFor(slot.group, level);
      const why = level === 'upper'
        ? `Add an adverb to show exactly HOW ${esc(`‘${verbText}’`)} happens. It will go ${slot.pos === 'before' ? 'just before' : 'just after'} the verb. Choose one that fits the mood of your writing.`
        : `Add an adverb to say HOW ${esc(`‘${verbText}’`)} happens.`;
      modal = openModal(pickerShell('Add an adverb', 'adverb', 'Adverb', why, luSentenceHtml(s, [slot.verb], 'verb'), optionGroups(groups), foot), 'adverb');
      $('#lu-options', modal).addEventListener('click', (ev) => {
        const b = ev.target.closest('.lu-opt');
        if (!b) return;
        lu.adds.adverb[s] = { word: b.dataset.word, tier: b.dataset.tier };
        closeModal(); renderLevelUp();
        toast(`➕ Added the adverb “${b.dataset.word}”`);
      });
    }

    if (kind === 'opener') {
      const sets = LU.openersFor(level);
      const legend = level === 'upper' ? '<p class="small muted" style="margin:0 0 6px"><span class="lu-dot tier-challenge"></span> 🚀 challenge &nbsp; <span class="lu-dot tier-ambitious"></span> ✨ ambitious</p>' : '';
      const body = legend + sets.map((set) => `<h3>${set.label}</h3>
        <div class="lu-options">${set.groups.map((g) => g.words.map((w) => `<button class="lu-opt tier-${g.tier}" data-word="${esc(w)}" data-tier="${g.tier}">${esc(w)}</button>`).join('')).join('')}</div>`).join('') + `
        <h3>✍️ Or write your own</h3>
        <div class="lu-own">
          <input id="lu-own-text" type="text" placeholder="e.g. Just after midnight" autocomplete="off" aria-label="Your own sentence opener">
          <button class="btn primary" id="lu-own-add">Add</button>
        </div>`;
      const why = level === 'upper'
        ? 'Start this sentence with a <strong>fronted adverbial</strong> to tell the reader when, where or how. A comma will be added after it.'
        : 'Start this sentence with an opener that tells us <strong>when</strong>, <strong>where</strong> or <strong>how</strong>. A comma will be added after it.';
      modal = openModal(pickerShell('Add a sentence opener', 'adverb', level === 'upper' ? 'Fronted adverbial' : 'Sentence opener', why,
        luSentenceHtml(s, [lu.slots.opener[s]], 'adverb'), body, foot), 'adverb');
      const choose = (text, tier) => {
        lu.adds.opener[s] = { text: upperFirst(text.trim().replace(/[,.]+$/, '')), tier };
        closeModal(); renderLevelUp();
        toast('🎬 Sentence opener added – with a comma!');
      };
      $('#lu-options', modal).addEventListener('click', (ev) => {
        const b = ev.target.closest('.lu-opt');
        if (b) choose(b.dataset.word, b.dataset.tier);
      });
      $('#lu-own-add', modal).onclick = () => {
        const v = $('#lu-own-text', modal).value.trim();
        if (!v) { toast('Type your own opener first'); return; }
        choose(v, 'own');
      };
    }

    if (kind === 'conj') {
      const slot = lu.slots.conj[s];
      const sets = LU.conjunctionsFor(level);
      const nextText = slot.join ? luSentenceHtml(slot.next, [], 'conjunction') : '';
      const coordTitle = level === 'upper' ? '🔗 Coordinating conjunctions (FANBOYS)' : '🔗 Joining words';
      const subTitle = level === 'upper' ? '🧩 Subordinating conjunctions' : '🧩 Joining words that explain';
      const tier = level === 'upper' ? 'ambitious' : 'lower';
      const joinPart = slot.join ? `
        <h3>➡️ Join it to the next sentence</h3>
        <p class="small muted" style="margin-top:0">Next sentence: “${nextText}”</p>
        ${optionGroups([{ title: coordTitle, tier, words: sets.coordinating }, { title: subTitle, tier: level === 'upper' ? 'challenge' : 'lower', words: sets.subordinating }], 'join')}` : '';
      const extendPart = `
        <h3>✍️ ${slot.join ? 'Or add' : 'Add'} more to this sentence</h3>
        <p class="small muted" style="margin-top:0">Choose a conjunction, then finish the sentence in your own words.</p>
        <div class="chips lu-conj-pick">${sets.coordinating.concat(sets.subordinating).map((c2) => `<button class="chip" data-pick-conj="${esc(c2)}">${esc(c2)}</button>`).join('')}</div>
        <div class="lu-own">
          <span class="lu-own-conj" id="lu-own-conj">because</span>
          <input id="lu-own-text" type="text" placeholder="…what happens next or why?" autocomplete="off" aria-label="Finish the sentence">
          <button class="btn primary" id="lu-own-add">Add</button>
        </div>`;
      const why = level === 'upper'
        ? 'Use a <strong>coordinating conjunction</strong> to join two equal clauses, or a <strong>subordinating conjunction</strong> to add a clause with extra information. Read it aloud afterwards to check it makes sense!'
        : 'Use a joining word to make a longer sentence. Read it aloud afterwards to check it makes sense!';
      modal = openModal(pickerShell('Add a conjunction', 'conjunction', 'Conjunction', why, luSentenceHtml(s, [slot.last], 'conjunction'), joinPart + extendPart, foot), 'conjunction');
      let pickedConj = 'because';
      $$('[data-pick-conj]', modal).forEach((b) => {
        b.onclick = () => {
          pickedConj = b.dataset.pickConj;
          $('#lu-own-conj', modal).textContent = pickedConj;
          $$('[data-pick-conj]', modal).forEach((x) => x.classList.toggle('on', x === b));
          $('#lu-own-text', modal).focus();
        };
      });
      $('#lu-options', modal).addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-join]');
        if (!b) return;
        lu.adds.conj[s] = { kind: 'join', conj: b.dataset.join, tier: b.dataset.tier };
        delete lu.adds.opener[slot.next];
        closeModal(); renderLevelUp();
        toast(`🔗 Joined with “${b.dataset.join}” – read it aloud to check it makes sense!`);
      });
      $('#lu-own-add', modal).onclick = () => {
        const v = $('#lu-own-text', modal).value.trim().replace(/[.!?]+$/, '');
        if (!v) { toast('Finish the sentence first!'); $('#lu-own-text', modal).focus(); return; }
        const sub = sets.subordinating.includes(pickedConj);
        lu.adds.conj[s] = { kind: 'extend', conj: pickedConj, clause: v, tier: level === 'upper' ? (sub ? 'challenge' : 'ambitious') : 'lower' };
        closeModal(); renderLevelUp();
        toast(`🔗 Added “${pickedConj} ${v}”`);
      };
    }

    $('#lu-hear-sentence', modal).onclick = () => speak(buildLevelUp('plain'));
    const rm = $('#lu-remove', modal);
    if (rm) rm.onclick = () => { delete lu.adds[kind][s]; closeModal(); renderLevelUp(); };
  }

  // ================================================================ FIGURATIVE
  let figTheme = '';
  let figSearch = '';
  const figPrompt = {};

  function figDevice(id) { return window.Figurative.DEVICES.find((d) => d.id === id); }
  const figStyle = (d) => `--dc:${d.colour};--ds:${d.soft}`;

  function figExampleHtml(d, e, showDevice) {
    const F = window.Figurative;
    const text = F.parts(e.t).map((p) => (p.mark ? `<mark>${esc(p.text)}</mark>` : esc(p.text))).join('');
    const plainText = F.plain(e.t);
    const entry = { word: plainText, cls: 'figurative', kind: 'sentence', sub: d.name, definition: e.m, example: '', sentence: '', synonyms: [] };
    return `
      <article class="fig-ex" style="${figStyle(d)}">
        ${showDevice ? `<a class="fig-dev-tag" href="#/figurative/${d.id}">${d.emoji} ${esc(d.name)}</a>` : ''}
        <p class="fig-text">${text}</p>
        ${e.x ? `<p class="fig-x">${d.id === 'imagery' ? 'Sense' : 'Sound'}: <strong>${esc(e.x)}</strong></p>` : ''}
        <dl class="fig-info">
          <dt>💭 What it means</dt><dd>${esc(e.m)}</dd>
          <dt>✍️ Use it when…</dt><dd>${esc(e.u)}</dd>
        </dl>
        <div class="fig-foot">
          <div class="fig-tags">${e.tags.map((t) => `<button class="fig-tag" data-theme="${t}">${esc(F.THEMES[t])}</button>`).join('')}</div>
          <div class="fig-actions">
            <button class="icon-btn" data-say="${esc(plainText)}" aria-label="Hear it">🔊</button>
            ${bankButton(entry, { small: true })}
          </div>
        </div>
      </article>`;
  }

  function figMatches(e) {
    const q = figSearch.trim().toLowerCase();
    return (!figTheme || e.tags.includes(figTheme)) &&
      (!q || window.Figurative.plain(e.t).toLowerCase().includes(q) || e.m.toLowerCase().includes(q) || e.u.toLowerCase().includes(q));
  }

  function themeChips(themes) {
    const F = window.Figurative;
    return `<button class="chip ${!figTheme ? 'on' : ''}" data-theme="">All themes</button>` +
      themes.map((t) => `<button class="chip ${figTheme === t ? 'on' : ''}" data-theme="${t}">${esc(F.THEMES[t])}</button>`).join('');
  }

  function renderFigurative(arg) {
    document.title = 'Figurative Language · What’s That Word?';
    const d = arg && figDevice(arg);
    if (d) renderFigDevice(d); else renderFigHome();
  }

  function wireFigCommon(rerender) {
    app.onclick = (ev) => {
      const th = ev.target.closest('[data-theme]');
      if (th) { figTheme = figTheme === th.dataset.theme && th.classList.contains('fig-tag') ? '' : th.dataset.theme; rerender(); return; }
      const say = ev.target.closest('[data-say]');
      if (say) speak(say.dataset.say);
    };
  }

  function renderFigHome() {
    const F = window.Figurative;
    const filtering = figTheme || figSearch.trim();
    let results = '';
    if (filtering) {
      const groups = F.DEVICES.map((d) => ({ d, list: d.examples.filter(figMatches) })).filter((g) => g.list.length);
      const n = groups.reduce((a, g) => a + g.list.length, 0);
      results = `
        <div class="fig-results-head">
          <h2>${n} example${n === 1 ? '' : 's'}${figTheme ? ` for ${esc(F.THEMES[figTheme])}` : ''}${figSearch.trim() ? ` matching “${esc(figSearch.trim())}”` : ''}</h2>
          <button class="btn small" id="fig-clear">✕ Show all techniques</button>
        </div>
        ${groups.map((g) => `
          <section class="fig-group">
            <h3><a href="#/figurative/${g.d.id}" style="color:${g.d.colour}">${g.d.emoji} ${esc(g.d.name)}</a> <span class="muted small">– ${esc(g.d.short)}</span></h3>
            <div class="fig-grid">${g.list.map((e) => figExampleHtml(g.d, e)).join('')}</div>
          </section>`).join('') || '<p class="muted">No examples match. Try another theme or word.</p>'}`;
    }
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">🎨 Creative writing techniques</p>
          <h1>Figurative <em>Language</em></h1>
        </div>
      </div>
      <p class="lead">Figurative language means using words in a creative, imaginative way, not just for their everyday meaning. Explore 11 techniques, each with examples you can use in your own writing.</p>
      <section class="card fig-finder">
        <h2>✍️ What are you writing about?</h2>
        <p class="muted small" style="margin-top:0">Choose a theme to see examples of every technique that would fit your writing.</p>
        <div class="chips">${themeChips(Object.keys(F.THEMES))}</div>
        <input type="search" id="fig-search" placeholder="🔎 Search the examples, e.g. moon, rain, dragon…" value="${esc(figSearch)}" aria-label="Search the examples">
      </section>
      ${filtering ? results : `
        <div class="fig-devices">
          ${F.DEVICES.map((d) => `
            <a class="fig-device" href="#/figurative/${d.id}" style="${figStyle(d)}">
              <span class="fig-emoji" aria-hidden="true">${d.emoji}</span>
              <strong>${esc(d.name)}</strong>
              <span class="fig-short">${esc(d.short)}</span>
              <span class="fig-eg">“${esc(F.plain(d.examples[0].t))}”</span>
              <span class="go">${d.examples.length} examples →</span>
            </a>`).join('')}
        </div>`}`;
    wireFigCommon(renderFigHome);
    const s = $('#fig-search');
    s.oninput = () => {
      figSearch = s.value;
      const pos = s.selectionStart;
      renderFigHome();
      const s2 = $('#fig-search'); s2.focus(); s2.setSelectionRange(pos, pos);
    };
    const clear = $('#fig-clear');
    if (clear) clear.onclick = () => { figTheme = ''; figSearch = ''; renderFigHome(); };
  }

  function renderFigDevice(d) {
    const F = window.Figurative;
    const idx = F.DEVICES.indexOf(d);
    const prev = F.DEVICES[(idx - 1 + F.DEVICES.length) % F.DEVICES.length];
    const next = F.DEVICES[(idx + 1) % F.DEVICES.length];
    const themes = Object.keys(F.THEMES).filter((t) => d.examples.some((e) => e.tags.includes(t)));
    if (figTheme && !themes.includes(figTheme)) figTheme = '';
    const list = d.examples.filter((e) => !figTheme || e.tags.includes(figTheme));
    if (figPrompt[d.id] == null) figPrompt[d.id] = 0;
    const prompt = d.prompts[figPrompt[d.id] % d.prompts.length];
    const canCheck = F.check(d.id, 'test') !== null;
    document.title = `${d.name} · Figurative Language`;

    app.innerHTML = `
      <nav class="fig-nav" aria-label="Techniques">
        <a class="fig-back" href="#/figurative">← All techniques</a>
        <div class="fig-pills">${F.DEVICES.map((x) => `<a class="fig-pill ${x === d ? 'on' : ''}" href="#/figurative/${x.id}" style="${figStyle(x)}">${x.emoji} ${esc(x.name)}</a>`).join('')}</div>
      </nav>
      <div class="fig-hero" style="${figStyle(d)}">
        <span class="fig-emoji big" aria-hidden="true">${d.emoji}</span>
        <div>
          <p class="eyebrow" style="color:${d.colour}">🎨 Figurative Language</p>
          <h1>${esc(d.name)}</h1>
          <p class="fig-short">${esc(d.short)}</p>
        </div>
        <button class="btn small" id="fig-hear-def">🔊 Hear it</button>
      </div>
      <div class="fig-learn">
        <section class="card fig-what" style="${figStyle(d)}">
          <h2>📘 What is it?</h2>
          <p>${d.what}</p>
          <h3>🔍 How to spot it</h3>
          <p>${esc(d.spot)}</p>
          <h3>🛠️ How to write your own</h3>
          <ul>${d.recipe.map((r) => `<li>${r}</li>`).join('')}</ul>
          <h3>💡 Why writers use it</h3>
          <p>${esc(d.why)}</p>
        </section>
        <section class="card fig-try" style="${figStyle(d)}">
          <h2>✍️ Try it yourself</h2>
          <p class="fig-prompt"><strong>Challenge:</strong> <span id="fig-prompt-text">${esc(prompt)}</span>
            <button class="btn small ghost" id="fig-new-prompt">🔄 New idea</button></p>
          <textarea id="fig-own" rows="3" placeholder="Write your own ${esc(d.name.toLowerCase())} here…" spellcheck="true"></textarea>
          <div class="input-actions">
            ${canCheck ? '<button class="btn primary" id="fig-check">✅ Check it</button>' : ''}
            <button class="btn" id="fig-hear-own">🔊 Hear it</button>
            <button class="btn" id="fig-save-own">📓 Save to my notebook</button>
          </div>
          <div id="fig-feedback" aria-live="polite">${canCheck ? '' : `<p class="small muted">Read it aloud to a partner. Can they spot the ${esc(d.name.toLowerCase())}?</p>`}</div>
        </section>
      </div>
      <div class="fig-results-head">
        <h2>📚 ${list.length} example${list.length === 1 ? '' : 's'}${figTheme ? ` for ${esc(F.THEMES[figTheme])}` : ''}</h2>
      </div>
      <div class="chips fig-theme-row">${themeChips(themes)}</div>
      <div class="fig-grid">${list.map((e) => figExampleHtml(d, e)).join('')}</div>
      <nav class="fig-prevnext">
        <a class="btn" href="#/figurative/${prev.id}">← ${prev.emoji} ${esc(prev.name)}</a>
        <a class="btn" href="#/figurative/${next.id}">${next.emoji} ${esc(next.name)} →</a>
      </nav>`;

    wireFigCommon(() => renderFigDevice(d));
    $('#fig-hear-def').onclick = () => speak(`${d.name}. ${$('.fig-what p').textContent}`);
    $('#fig-new-prompt').onclick = () => {
      figPrompt[d.id] = (figPrompt[d.id] + 1) % d.prompts.length;
      $('#fig-prompt-text').textContent = d.prompts[figPrompt[d.id]];
    };
    const own = $('#fig-own');
    const fb = $('#fig-feedback');
    const chk = $('#fig-check');
    if (chk) {
      chk.onclick = () => {
        const v = own.value.trim();
        if (!v) { toast('Write your own example first!'); own.focus(); return; }
        const r = F.check(d.id, v);
        fb.innerHTML = `<div class="feedback ${r.ok ? 'good' : 'try'}">${r.ok ? '🎉' : '🤔'} ${esc(r.message)}</div>`;
      };
    }
    $('#fig-hear-own').onclick = () => { if (own.value.trim()) speak(own.value.trim()); else toast('Write your own example first!'); };
    $('#fig-save-own').onclick = () => {
      const v = own.value.trim();
      if (!v) { toast('Write your own example first!'); own.focus(); return; }
      bank.add({ word: v, cls: 'figurative', kind: 'sentence', sub: `${d.name} (my own)`, definition: '', example: '', sentence: '', synonyms: [] });
      toast('📓 Your example has been saved to your notebook');
    };
  }

  // ================================================================ ALAN PEAT SENTENCES
  let peatSet = '';
  // pupils' Alan Peat sentences are kept in their notebook
  const peatStore = {
    all() {
      const out = {};
      bank.all().filter((e) => e.cls === 'peat' && e.peatId).forEach((e) => {
        (out[e.peatId] = out[e.peatId] || []).push({ text: e.word, added: e.added });
      });
      return out;
    },
    list(id) { return this.all()[id] || []; },
    add(id, text) {
      const t = window.Peat.TYPES.find((x) => x.id === id);
      bank.add({ word: text, cls: 'peat', kind: 'sentence', sub: t ? t.name : 'Alan Peat sentence', peatId: id, definition: '', example: '', sentence: '', synonyms: [] });
    },
    remove(id, index) {
      const item = this.list(id)[index];
      if (item) bank.remove(item.text, 'peat');
    },
    count() { return Object.values(this.all()).reduce((n, l) => n + l.length, 0); },
  };
  const peatStyle = (t) => { const s = window.Peat.SETS[t.set]; return `--pc:${s.colour};--ps:${s.soft}`; };

  function peatExampleHtml(t, e) {
    const P = window.Peat;
    const ex = P.example(e);
    const text = P.parts(ex.t).map((p) => (p.mark ? `<mark>${esc(p.text)}</mark>` : esc(p.text))).join('');
    return `<li><span>${text}${ex.note ? ` <span class="peat-note">(${esc(ex.note)})</span>` : ''}</span>
      <button class="icon-btn" data-say="${esc(P.plain(ex))}" aria-label="Hear it">🔊</button></li>`;
  }

  function renderPeat(arg) {
    document.title = 'Alan Peat Sentences · What’s That Word?';
    app.onclick = (ev) => {
      const say = ev.target.closest('[data-say]');
      if (say) speak(say.dataset.say);
    };
    if (arg === 'mine') { renderPeatMine(); return; }
    const t = arg && window.Peat.TYPES.find((x) => x.id === arg);
    if (t) renderPeatType(t); else renderPeatHome();
  }

  function renderPeatHome() {
    const P = window.Peat;
    const mine = peatStore.all();
    const total = peatStore.count();
    const list = P.TYPES.filter((t) => !peatSet || t.set === peatSet);
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">🧱 Sentence types</p>
          <h1>Alan Peat <em>Sentences</em></h1>
        </div>
        <a class="btn" href="#/peat/mine">📒 My sentence collection${total ? ` (${total})` : ''}</a>
      </div>
      <p class="lead">${P.TYPES.length} sentence types to make your writing more varied and interesting. Open one to see how it works, read the examples, then write and save your own!</p>
      <div class="chips peat-sets" role="group" aria-label="Colour sets">
        <button class="chip ${!peatSet ? 'on' : ''}" data-set="">All sentence types</button>
        ${Object.keys(P.SETS).map((k) => `<button class="chip peat-set-chip ${peatSet === k ? 'on' : ''}" data-set="${k}" style="--pc:${P.SETS[k].colour};--ps:${P.SETS[k].soft}"><span class="peat-dot"></span>${esc(P.SETS[k].label)}</button>`).join('')}
      </div>
      <div class="peat-grid">
        ${list.map((t) => {
          const n = (mine[t.id] || []).length;
          return `<a class="peat-card" href="#/peat/${t.id}" style="${peatStyle(t)}">
            <span class="peat-set-label">${esc(P.SETS[t.set].label)}</span>
            <strong>${esc(t.name)}</strong>
            <span class="peat-formula">${t.formula}</span>
            <span class="peat-eg">${esc(P.plain(t.examples[0]))}</span>
            <span class="peat-mine">${n ? `✏️ ${n} of my own` : 'Write your own →'}</span>
          </a>`;
        }).join('')}
      </div>`;
    $$('[data-set]').forEach((b) => { b.onclick = () => { peatSet = b.dataset.set; renderPeatHome(); }; });
  }

  function peatChecklist(t, text) {
    const res = window.Peat.check(t, text, window.Grammar);
    return res.map((r) => `<li class="${r.ok === null ? 'self' : r.ok ? 'ok' : 'no'}">
      <span class="tick" aria-hidden="true">${r.ok === null ? '👀' : r.ok ? '✓' : '○'}</span>${esc(r.text)}${r.ok === null ? ' <em class="muted">(check this yourself)</em>' : ''}</li>`).join('');
  }

  function renderPeatType(t) {
    const P = window.Peat;
    const set = P.SETS[t.set];
    const idx = P.TYPES.indexOf(t);
    const prev = P.TYPES[(idx - 1 + P.TYPES.length) % P.TYPES.length];
    const next = P.TYPES[(idx + 1) % P.TYPES.length];
    const mine = peatStore.list(t.id);
    document.title = `${t.name} · Alan Peat Sentences`;
    app.innerHTML = `
      <nav class="fig-nav">
        <a class="fig-back" href="#/peat">← All sentence types</a>
        <a class="fig-back" href="#/peat/mine">📒 My sentence collection</a>
      </nav>
      <div class="peat-hero" style="${peatStyle(t)}">
        <span class="peat-set-label">${esc(set.label)} · ${idx + 1} of ${P.TYPES.length}</span>
        <h1>${esc(t.name)}</h1>
        <p class="peat-formula big">${t.formula}</p>
      </div>
      <div class="fig-learn">
        <section class="card peat-learn" style="${peatStyle(t)}">
          <h2>📘 What is it?</h2>
          <p>${t.what}</p>
          <h3>🧱 Building blocks</h3>
          <div class="peat-parts">${t.parts.map((p) => `<span class="peat-part">${esc(p)}</span>`).join('<span class="peat-arrow" aria-hidden="true">→</span>')}</div>
          <h3>📌 Examples</h3>
          <ul class="examples peat-examples">${t.examples.map((e) => peatExampleHtml(t, e)).join('')}</ul>
          <p class="tip">💡 <strong>Top tip:</strong> ${esc(t.tip)}</p>
        </section>
        <section class="card peat-try" style="${peatStyle(t)}">
          <h2>✍️ Your turn</h2>
          <p style="margin-top:0">Write your own <strong>${esc(t.name.replace(/ sentences?$/i, ''))}</strong> sentence. The checklist ticks off each part as you write!</p>
          <textarea id="peat-own" rows="4" placeholder="Write your sentence here…" spellcheck="true"></textarea>
          <ul class="peat-check" id="peat-check" aria-live="polite">${peatChecklist(t, '')}</ul>
          <div class="input-actions">
            <button class="btn primary" id="peat-add">➕ Add to my examples</button>
            <button class="btn" id="peat-hear">🔊 Hear it</button>
          </div>
        </section>
      </div>
      <section class="card peat-mine-list" style="${peatStyle(t)}">
        <h2>📒 My examples <span class="muted small" style="font-weight:400">(${mine.length}) · also saved in <a href="#/notebook/sentences">your notebook</a></span></h2>
        ${mine.length ? `<ul class="examples">${mine.map((m, i) => `
          <li><span>${esc(m.text)}</span>
            <span class="peat-mine-actions">
              <button class="icon-btn" data-say="${esc(m.text)}" aria-label="Hear it">🔊</button>
              <button class="icon-btn" data-peat-remove="${i}" aria-label="Remove this example">🗑️</button>
            </span></li>`).join('')}</ul>`
        : '<p class="muted" style="margin:0">You haven’t added any examples yet. Write one above and press <strong>➕ Add to my examples</strong>.</p>'}
      </section>
      <nav class="fig-prevnext">
        <a class="btn" href="#/peat/${prev.id}">← ${esc(prev.name)}</a>
        <a class="btn" href="#/peat/${next.id}">${esc(next.name)} →</a>
      </nav>`;

    const ta = $('#peat-own');
    const list = $('#peat-check');
    ta.addEventListener('input', () => { list.innerHTML = peatChecklist(t, ta.value); });
    $('#peat-hear').onclick = () => { if (ta.value.trim()) speak(ta.value.trim()); else toast('Write your sentence first!'); };
    $('#peat-add').onclick = () => {
      const v = ta.value.trim().replace(/\s+/g, ' ');
      if (!v) { toast('Write your sentence first!'); ta.focus(); return; }
      const res = P.check(t, v, window.Grammar);
      const missing = res.filter((r) => r.ok === false).length;
      if (missing && !confirm(`${missing} part${missing === 1 ? ' of the checklist is' : 's of the checklist are'} not ticked yet. Add it anyway?`)) return;
      peatStore.add(t.id, v);
      toast(missing ? '📓 Added to your examples and your notebook' : '🎉 Brilliant! Added to your examples and your notebook');
      renderPeatType(t);
    };
    $$('[data-peat-remove]').forEach((b) => {
      b.onclick = () => {
        if (!confirm('Remove this example?')) return;
        peatStore.remove(t.id, +b.dataset.peatRemove);
        renderPeatType(t);
      };
    });
  }

  function renderPeatMine() {
    const P = window.Peat;
    const all = peatStore.all();
    const types = P.TYPES.filter((t) => (all[t.id] || []).length);
    const total = peatStore.count();
    document.title = 'My sentence collection · Alan Peat Sentences';
    app.innerHTML = `
      <nav class="fig-nav"><a class="fig-back" href="#/peat">← All sentence types</a></nav>
      <div class="page-head">
        <div>
          <p class="eyebrow">🧱 Alan Peat Sentences</p>
          <h1>My sentence <em>collection</em></h1>
        </div>
        ${total ? `<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn small" id="peat-copy">📋 Copy all</button>
          <button class="btn small" id="peat-print">🖨️ Print</button>
        </div>` : ''}
      </div>
      ${total ? `<p class="lead">You have written <strong>${total}</strong> sentence${total === 1 ? '' : 's'} using <strong>${types.length}</strong> of the ${P.TYPES.length} sentence types.${types.length < P.TYPES.length ? ' Can you try a new one?' : ' You’ve tried them all. Amazing!'}</p>
        <div class="peat-progress" aria-hidden="true">${P.TYPES.map((t) => `<a href="#/peat/${t.id}" class="${(all[t.id] || []).length ? 'done' : ''}" style="${peatStyle(t)}" title="${esc(t.name)}"></a>`).join('')}</div>
        ${types.map((t) => `
          <section class="card peat-mine-list" style="${peatStyle(t)}">
            <h2><a href="#/peat/${t.id}">${esc(t.name)}</a> <span class="peat-set-label">${esc(P.SETS[t.set].label)}</span></h2>
            <ul class="examples">${all[t.id].map((m) => `<li><span>${esc(m.text)}</span><button class="icon-btn" data-say="${esc(m.text)}" aria-label="Hear it">🔊</button></li>`).join('')}</ul>
          </section>`).join('')}`
      : `<div class="card empty">
          <div class="big" aria-hidden="true">📒</div>
          <h2>Your collection is empty</h2>
          <p class="muted">Open a sentence type, write your own example and press <strong>➕ Add to my examples</strong>. It will appear here.</p>
          <a class="btn primary" href="#/peat">🧱 Choose a sentence type</a>
        </div>`}
      <p class="small muted" style="margin-top:24px">Your sentences are saved on this device, in this browser.</p>`;
    if (total) {
      $('#peat-print').onclick = () => window.print();
      $('#peat-copy').onclick = () => copyText(types.map((t) => `${t.name}\n` + all[t.id].map((m) => `• ${m.text}`).join('\n')).join('\n\n'));
    }
  }

  // ================================================================ NOTEBOOK
  // My Notebook has two pages: a word bank of interesting words, and sentences.
  const SENTENCE_SOURCES = {
    own: { label: 'My sentence', chip: '✍️ My own' },
    peat: { label: 'Alan Peat sentence', chip: '🧱 Alan Peat' },
    figurative: { label: 'Figurative language', chip: '🎨 Figurative language' },
    levelup: { label: 'Levelled-up writing', chip: '⚡ Level Up!' },
  };
  const isSentence = (e) => e.kind === 'sentence' || ['figurative', 'peat', 'levelup', 'own'].includes(e.cls);
  let nbFilter = { words: '', sentences: '' };
  let nbSearch = { words: '', sentences: '' };

  function renderNotebook(tab) {
    tab = tab === 'sentences' ? 'sentences' : 'words';
    document.title = 'My Notebook · What’s That Word?';
    const all = bank.all();
    const words = all.filter((e) => !isSentence(e));
    const sents = all.filter(isSentence);
    const items = tab === 'words' ? words : sents;
    const q = nbSearch[tab].toLowerCase();
    const f = nbFilter[tab];
    const list = items.filter((e) => (!f || e.cls === f) && (!q || e.word.toLowerCase().includes(q) || (e.definition || '').toLowerCase().includes(q)));

    const wordFilters = ORDER.filter((c) => words.some((e) => e.cls === c));
    const sentFilters = Object.keys(SENTENCE_SOURCES).filter((c) => sents.some((e) => e.cls === c));
    const filters = tab === 'words'
      ? wordFilters.map((c) => `<button class="chip ${f === c ? 'on' : ''}" data-f="${c}"><span class="swatch c-${c}"></span>${esc(clsInfo(c).label)}s</button>`).join('')
      : sentFilters.map((c) => `<button class="chip ${f === c ? 'on' : ''}" data-f="${c}">${esc(SENTENCE_SOURCES[c].chip)}</button>`).join('');

    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">📓 Words and sentences to use in your writing</p>
          <h1>My <em>Notebook</em></h1>
        </div>
        ${items.length ? `<div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn small" id="nb-copy">📋 Copy</button>
          <button class="btn small" id="nb-print">🖨️ Print</button>
        </div>` : ''}
      </div>
      <div class="nb-tabs" role="tablist" aria-label="Notebook pages">
        <a role="tab" href="#/notebook/words" aria-selected="${tab === 'words'}">📖 Word bank <span class="lu-count">${words.length}</span></a>
        <a role="tab" href="#/notebook/sentences" aria-selected="${tab === 'sentences'}">✍️ Sentences <span class="lu-count">${sents.length}</span></a>
      </div>
      <div class="nb-paper">
        <section class="nb-add no-print">
          ${tab === 'words' ? `
            <h2>➕ Add an interesting word</h2>
            <div class="nb-add-row">
              <input id="nb-word" type="text" placeholder="Word" autocomplete="off" autocapitalize="none" aria-label="Word">
              <input id="nb-meaning" type="text" placeholder="What it means (optional)" autocomplete="off" aria-label="What it means">
              <button class="btn primary" id="nb-add-word">Add</button>
            </div>` : `
            <h2>➕ Add a sentence</h2>
            <textarea id="nb-sentence" rows="2" placeholder="Write a brilliant sentence you want to remember…" spellcheck="true" aria-label="Your sentence"></textarea>
            <div class="input-actions" style="margin-top:8px"><button class="btn primary" id="nb-add-sentence">Add to my notebook</button></div>`}
        </section>
        ${items.length ? `
          <div class="bank-tools">
            <input type="search" id="nb-search" placeholder="${tab === 'words' ? 'Find a word…' : 'Find a sentence…'}" value="${esc(nbSearch[tab])}" aria-label="Search my notebook">
            <div class="chips">
              <button class="chip ${!f ? 'on' : ''}" data-f="">All (${items.length})</button>
              ${filters}
            </div>
          </div>
          ${tab === 'words'
            ? `<div class="bank-grid">${list.map(bankCard).join('') || '<p class="muted">No words match.</p>'}</div>`
            : `<ol class="nb-lines">${list.map(sentenceLine).join('') || '<p class="muted">No sentences match.</p>'}</ol>`}`
        : `<div class="empty">
            <div class="big" aria-hidden="true">${tab === 'words' ? '🌱' : '✍️'}</div>
            <h2>${tab === 'words' ? 'Your word bank is empty' : 'No sentences yet'}</h2>
            <p class="muted">${tab === 'words'
              ? 'Add a word above, or tap <strong>☆ Add to notebook</strong> on any word card.'
              : 'Write one above, or save sentences from Alan Peat Sentences, Figurative Language and Level Up!'}</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
              ${tab === 'words'
                ? '<a class="btn" href="#/grammar">✏️ Glorious Grammar</a><a class="btn" href="#/vocab">📖 Vivid Vocabulary</a>'
                : '<a class="btn" href="#/peat">🧱 Alan Peat Sentences</a><a class="btn" href="#/figurative">🎨 Figurative Language</a><a class="btn" href="#/levelup">⚡ Level Up!</a>'}
            </div>
          </div>`}
      </div>
      <p class="small muted no-print" style="margin-top:24px">Your notebook is saved on this device, in this browser.
        ${items.length ? `<button class="linkish" id="nb-clear">Empty the ${tab === 'words' ? 'word bank' : 'sentences page'}</button>` : ''}</p>`;

    app.onclick = (ev) => {
      const say = ev.target.closest('[data-say]');
      if (say) { speak(say.dataset.say); return; }
      const rm = ev.target.closest('[data-remove]');
      if (rm) {
        const [w, cl] = JSON.parse(rm.dataset.remove);
        if (tab === 'sentences' && !confirm('Remove this sentence from your notebook?')) return;
        bank.remove(w, cl);
        toast(tab === 'words' ? `Removed “${w}”` : 'Sentence removed');
        renderNotebook(tab);
      }
    };
    $$('[data-f]').forEach((b) => { b.onclick = () => { nbFilter[tab] = b.dataset.f; renderNotebook(tab); }; });
    const s = $('#nb-search');
    if (s) s.oninput = () => {
      nbSearch[tab] = s.value;
      const pos = s.selectionStart;
      renderNotebook(tab);
      const s2 = $('#nb-search'); s2.focus(); s2.setSelectionRange(pos, pos);
    };
    const pr = $('#nb-print'); if (pr) pr.onclick = () => window.print();
    const cp = $('#nb-copy');
    if (cp) cp.onclick = () => copyText(tab === 'words'
      ? list.map((e) => `${e.word} (${(e.sub || clsInfo(e.cls).label).toLowerCase()})${e.definition ? ` – ${e.definition}` : ''}`).join('\n')
      : list.map((e) => `• ${e.word}`).join('\n'));
    const clr = $('#nb-clear');
    if (clr) clr.onclick = () => {
      if (!confirm(`Remove everything from your ${tab === 'words' ? 'word bank' : 'sentences page'}? This can’t be undone.`)) return;
      store.set('bank', bank.all().filter((e) => (tab === 'words' ? isSentence(e) : !isSentence(e))));
      updateCount();
      renderNotebook(tab);
    };

    if (tab === 'words') {
      const wIn = $('#nb-word');
      const add = () => {
        const w = wIn.value.trim().replace(/\s+/g, ' ');
        if (!w) { toast('Type a word first!'); wIn.focus(); return; }
        const tok = /\s/.test(w) ? null : window.Grammar.analyse(w).tokens[0];
        const cls = tok && tok.cls !== 'other' ? tok.cls : 'other';
        bank.add({ word: w, cls, kind: 'word', definition: $('#nb-meaning').value.trim(), example: '', sentence: '', synonyms: [], own: true });
        toast(`⭐ “${w}” added to your word bank`);
        renderNotebook('words');
        $('#nb-word').focus();
      };
      $('#nb-add-word').onclick = add;
      [wIn, $('#nb-meaning')].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); }));
    } else {
      $('#nb-add-sentence').onclick = () => {
        const v = $('#nb-sentence').value.trim().replace(/\s+/g, ' ');
        if (!v) { toast('Write a sentence first!'); $('#nb-sentence').focus(); return; }
        bank.add({ word: v, cls: 'own', kind: 'sentence', sub: 'My sentence', definition: '', example: '', sentence: '', synonyms: [] });
        toast('✍️ Sentence added to your notebook');
        renderNotebook('sentences');
      };
    }
  }

  function sentenceLine(e) {
    const date = e.added ? new Date(e.added).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
    const src = SENTENCE_SOURCES[e.cls];
    const label = e.sub || (src ? src.label : 'Sentence');
    return `
      <li class="nb-line c-${esc(e.cls)}">
        <div class="nb-line-head">
          <span class="nb-src">${esc(label)}</span>
          <span class="date">${esc(date)}</span>
        </div>
        <p class="nb-text">${esc(e.word)}</p>
        ${e.definition ? `<p class="nb-meta">💭 ${esc(e.definition)}</p>` : ''}
        ${e.replaced ? `<p class="nb-meta">⚡ Before levelling up: “${esc(e.replaced)}”</p>` : ''}
        <div class="nb-actions">
          <button class="icon-btn" data-say="${esc(e.word)}" aria-label="Hear it">🔊</button>
          <button class="icon-btn" data-remove='${esc(JSON.stringify([e.word, e.cls]))}' aria-label="Remove this sentence">🗑️</button>
        </div>
      </li>`;
  }

  function bankCard(e) {
    const date = e.added ? new Date(e.added).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
    return `
      <article class="card bank-card c-${esc(e.cls)}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          ${badge(e.cls, e.sub ? cap(e.sub) : clsInfo(e.cls).label)}
          <span class="date">${esc(date)}</span>
        </div>
        <h3 class="${e.word.length > 24 ? 'long' : ''}">${esc(e.word)}</h3>
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

  // sentences saved in the old Alan Peat collection move into the notebook
  function migratePeat() {
    const old = store.get('peat', null);
    if (!old || !Object.keys(old).length || !window.Peat) return;
    Object.keys(old).forEach((id) => {
      const t = window.Peat.TYPES.find((x) => x.id === id);
      (old[id] || []).slice().reverse().forEach((m) => {
        bank.add({ word: m.text, cls: 'peat', kind: 'sentence', sub: t ? t.name : 'Alan Peat sentence', peatId: id, definition: '', example: '', sentence: '', synonyms: [], added: m.added });
      });
    });
    store.set('peat', {});
  }

  // ------------------------------------------------------------ start
  migratePeat();
  updateCount();
  applyFont();
  route();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
