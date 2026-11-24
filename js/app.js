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
  };

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
    else if (page === 'bank') renderBank();
    else renderHome();
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
  const VOCAB_IDEAS = ['enormous', 'whisper', 'gloomy', 'swiftly', 'courage', 'glimmer', 'furious', 'tremble'];

  function renderVocab(word) {
    document.title = 'Vivid Vocabulary Corner · What’s That Word?';
    const recent = store.get('recent', []);
    app.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">📖 Corner 2</p>
          <h1>Vivid <em>Vocabulary</em> Corner</h1>
        </div>
      </div>
      <form class="search" id="vocab-form" role="search">
        <input id="vocab-in" type="search" placeholder="Type a word…" autocomplete="off" autocapitalize="none" spellcheck="true" aria-label="Word to look up" value="${esc(word)}">
        <button class="btn primary" type="submit">Look it up</button>
      </form>
      <div class="search-extras">
        <div class="chips"><span class="label">Try:</span>${VOCAB_IDEAS.map((w) => `<a class="chip" href="#/vocab/${w}">${w}</a>`).join('')}</div>
        ${recent.length ? `<div class="chips"><span class="label">Recent:</span>${recent.map((w) => `<a class="chip" href="#/vocab/${encodeURIComponent(w)}">${esc(w)}</a>`).join('')}</div>` : ''}
      </div>
      <div id="vocab-out"></div>`;
    $('#vocab-form').onsubmit = (e) => {
      e.preventDefault();
      const w = window.Lookup.cleanWord($('#vocab-in').value);
      if (!w) { toast('Type a word to look up'); return; }
      const target = '#/vocab/' + encodeURIComponent(w);
      if (location.hash === target) renderVocab(w); else location.hash = target;
    };
    if (word) lookupWord(word);
    else $('#vocab-in').focus();
  }

  async function lookupWord(raw) {
    const out = $('#vocab-out');
    const word = window.Lookup.cleanWord(raw);
    if (!word) return;
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
      out.innerHTML = `<div class="notice">${offlineMsg()}</div>`;
      return;
    }
    if (!$('#vocab-out') || out !== $('#vocab-out')) return;   // user moved on
    if (!info) {
      const sug = await window.Lookup.suggest(word).catch(() => []);
      out.innerHTML = `<div class="notice">
        <h3>🤔 We couldn’t find “${esc(word)}”</h3>
        <p style="margin:0 0 10px">Check the spelling and try again.</p>
        ${sug.length ? `<div class="chips"><span class="label muted">Did you mean:</span>${sug.map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>` : ''}
      </div>`;
      return;
    }

    const recent = [word].concat(store.get('recent', []).filter((w) => w !== word)).slice(0, 10);
    store.set('recent', recent);

    const classes = info.meanings.map((m) => m.cls);
    out.innerHTML = `
      <div class="word-head">
        <div>
          <h2>${esc(info.word)}</h2>
          ${info.phonetic ? `<div class="phonetic">${esc(info.phonetic)}</div>` : ''}
          ${info.from ? `<div class="small muted">You searched for “${esc(info.from)}”, which comes from “${esc(info.word)}”.</div>` : ''}
        </div>
        <div class="actions">
          <button class="btn" id="say-word">🔊 Hear it</button>
        </div>
      </div>
      <div class="can-be"><span class="muted">“${esc(info.word)}” can be ${classes.length > 1 ? 'used as' : 'a'}:</span> ${classes.map((c) => badge(c)).join(' ')}</div>
      <div class="vocab-grid">
        <div id="meanings">
          ${info.meanings.map((m, i) => meaningCard(info, m, i)).join('')}
        </div>
        <aside class="card thesaurus" id="thesaurus">
          <h3>🔁 Thesaurus</h3>
          <div class="loading"><span class="spinner"></span> Finding more words…</div>
        </aside>
      </div>
      <p class="source">Definitions from the Free Dictionary API (Wiktionary, CC BY-SA). Thesaurus from Datamuse.</p>`;

    $('#say-word').onclick = () => {
      if (info.audio) { const a = new Audio(info.audio); a.play().catch(() => speak(info.word)); } else speak(info.word);
    };
    $$('[data-say]', out).forEach((b) => { b.onclick = () => speak(b.dataset.say); });
    $$('.more-defs', out).forEach((b) => {
      b.onclick = () => { b.previousElementSibling.querySelectorAll('[hidden]').forEach((li) => { li.hidden = false; }); b.remove(); };
    });

    window.Lookup.thesaurus(info.word).then((t) => {
      const el = $('#thesaurus');
      if (!el) return;
      const groups = Object.keys(t.synonyms).filter((c) => c !== 'other').sort((a, b) => classes.indexOf(a) - classes.indexOf(b));
      if (t.synonyms.other && !groups.length) groups.push('other');
      const chipList = (list) => `<div class="chips">${list.map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>`;
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

  function meaningCard(info, m, idx) {
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
          ${defs.map((d, i) => `<li ${i >= shown ? 'hidden' : ''}>${esc(d.definition)}${d.example ? `<span class="ex">“${esc(d.example)}” <button class="icon-btn" data-say="${esc(d.example)}" aria-label="Hear the example">🔊</button></span>` : ''}</li>`).join('')}
        </ol>
        ${defs.length > shown ? `<button class="btn small ghost more-defs">Show ${defs.length - shown} more meaning${defs.length - shown === 1 ? '' : 's'}</button>` : ''}
        ${m.synonyms.length ? `<p class="sub-h">Synonyms</p><div class="chips">${m.synonyms.slice(0, 12).map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>` : ''}
        ${m.antonyms.length ? `<p class="sub-h">Opposites</p><div class="chips">${m.antonyms.slice(0, 8).map((s) => `<a class="chip" href="#/vocab/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>` : ''}
      </section>`;
  }
  function article(s) { return /^[aeiou]/i.test(s) ? 'An' : 'A'; }

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
  route();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
