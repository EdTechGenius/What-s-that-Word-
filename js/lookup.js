/*
 * lookup.js — dictionary definitions and synonyms.
 *
 * Definitions:  Free Dictionary API  https://dictionaryapi.dev  (data from Wiktionary, CC BY-SA)
 * Synonyms etc: Datamuse API          https://www.datamuse.com/api/
 * Both are free and need no API key. Results are cached in memory and the
 * service worker keeps a copy so words looked up before still work offline.
 */
(function (root) {
  'use strict';

  const DICT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const MUSE = 'https://api.datamuse.com/';
  const memo = new Map();

  // map dictionary part-of-speech names to our word-class keys
  const POS_MAP = {
    noun: 'noun', 'proper noun': 'propernoun', verb: 'verb', adjective: 'adjective', adverb: 'adverb',
    pronoun: 'pronoun', preposition: 'preposition', conjunction: 'conjunction', interjection: 'interjection',
    determiner: 'determiner', article: 'determiner', numeral: 'determiner', exclamation: 'interjection',
    particle: 'adverb', 'auxiliary verb': 'verb', 'modal verb': 'verb',
  };
  const MUSE_POS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prop: 'propernoun' };
  const THESAURUS_CLASSES = ['noun', 'verb', 'adjective', 'adverb'];

  async function getJSON(url) {
    if (memo.has(url)) return memo.get(url);
    const p = fetch(url, { headers: { Accept: 'application/json' } }).then(async (res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      // Datamuse word lists: use British spellings
      if (Array.isArray(data) && url.startsWith(MUSE)) data.forEach((x) => { if (x && x.word) x.word = british(x.word); });
      return data;
    });
    memo.set(url, p);
    try { return await p; } catch (e) { memo.delete(url); throw e; }
  }

  function cleanWord(w) {
    return String(w || '').trim().toLowerCase().replace(/[’]/g, "'").replace(/[^a-z' -]/g, '').replace(/\s+/g, ' ');
  }

  /** Raw dictionary entries for a word, or null if not found. */
  async function dictionary(word) {
    const w = cleanWord(word);
    if (!w) return null;
    const data = await getJSON(DICT + encodeURIComponent(w));
    return Array.isArray(data) && data.length ? data : null;
  }

  /**
   * A tidy summary of a word: { word, phonetic, audio, meanings: [ { cls, pos, definitions:[{definition, example}], synonyms, antonyms } ], source }
   * Meanings with the same word class are merged.
   */
  async function define(word) {
    const entries = await dictionary(word);
    if (!entries) return null;
    const out = { word: entries[0].word, phonetic: '', audio: '', meanings: [], source: '' };
    const byCls = new Map();
    for (const e of entries) {
      if (!out.phonetic) out.phonetic = e.phonetic || (e.phonetics || []).map((p) => p.text).find(Boolean) || '';
      if (!out.audio) {
        const a = (e.phonetics || []).filter((p) => p.audio);
        out.audio = ((a.find((p) => /-uk\./.test(p.audio)) || a[0]) || {}).audio || '';
      }
      if (!out.source && e.sourceUrls && e.sourceUrls[0]) out.source = e.sourceUrls[0];
      for (const m of e.meanings || []) {
        const cls = POS_MAP[m.partOfSpeech] || 'other';
        if (!byCls.has(cls)) {
          const entry = { cls, pos: m.partOfSpeech, definitions: [], synonyms: [], antonyms: [] };
          byCls.set(cls, entry);
          out.meanings.push(entry);
        }
        const entry = byCls.get(cls);
        for (const d of m.definitions || []) {
          if (!d.definition || /^\(?(obsolete|archaic|dated|rare)\b/i.test(d.definition)) continue;
          entry.definitions.push({ definition: tidy(d.definition), example: d.example ? tidy(d.example) : '' });
          (d.synonyms || []).forEach((s) => addUnique(entry.synonyms, s));
          (d.antonyms || []).forEach((s) => addUnique(entry.antonyms, s));
        }
        (m.synonyms || []).forEach((s) => addUnique(entry.synonyms, s));
        (m.antonyms || []).forEach((s) => addUnique(entry.antonyms, s));
      }
    }
    out.meanings = out.meanings.filter((m) => m.definitions.length);
    return out.meanings.length ? out : null;
  }

  function tidy(s) {
    return britishText(String(s).replace(/\s+/g, ' ').trim());
  }

  // ---- British spellings for words and definitions that come from American sources
  const US_UK = {
    color: 'colour', colors: 'colours', colored: 'coloured', colorful: 'colourful', favorite: 'favourite',
    favorites: 'favourites', behavior: 'behaviour', honor: 'honour', humor: 'humour', neighbor: 'neighbour',
    neighbors: 'neighbours', flavor: 'flavour', harbor: 'harbour', labor: 'labour', rumor: 'rumour', odor: 'odour',
    vapor: 'vapour', armor: 'armour', valor: 'valour', vigor: 'vigour', glamor: 'glamour', center: 'centre',
    centers: 'centres', theater: 'theatre', gray: 'grey', grayish: 'greyish', mold: 'mould', moldy: 'mouldy',
    plow: 'plough', pajamas: 'pyjamas', aluminum: 'aluminium', jewelry: 'jewellery', mom: 'mum', fiber: 'fibre',
    defense: 'defence', offense: 'offence', cozy: 'cosy', skeptical: 'sceptical', somber: 'sombre', meager: 'meagre',
    traveled: 'travelled', traveling: 'travelling', traveler: 'traveller', canceled: 'cancelled', labeled: 'labelled',
    modeled: 'modelled', marvelous: 'marvellous', woolen: 'woollen', fueled: 'fuelled', quarreled: 'quarrelled',
    leveled: 'levelled', signaled: 'signalled', jeweled: 'jewelled', catalog: 'catalogue', analog: 'analogue',
    gotten: 'got', airplane: 'aeroplane', candor: 'candour', rancor: 'rancour', savior: 'saviour', savor: 'savour',
    savory: 'savoury', splendor: 'splendour', tumor: 'tumour', clamor: 'clamour', ardor: 'ardour', fervor: 'fervour',
  };
  const KEEP_IZE = /^(size|prize|maize|baize|seize|assize|capsize|downsize|oversize|undersize|outsize|resize|upsize|supersize)$/;
  /** One word: American -> British spelling (fossilized -> fossilised, color -> colour). */
  function british(word) {
    const w = String(word);
    const low = w.toLowerCase();
    let out = US_UK[low];
    if (!out) {
      const m = /^([a-z]{3,})(iz|yz)(e|es|ed|ing|ation|ations|er|ers)$/.exec(low);
      if (m && !KEEP_IZE.test(m[1] + m[2] + 'e')) out = m[1] + (m[2] === 'iz' ? 'is' : 'ys') + m[3];
    }
    if (!out) return w;
    if (w === w.toUpperCase() && w.length > 1) return out.toUpperCase();
    return /^[A-Z]/.test(w) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  }
  function britishText(text) {
    return String(text).replace(/[A-Za-z]+/g, (w) => british(w));
  }
  function addUnique(arr, s) {
    const v = tidy(s);
    if (v && !arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v);
  }

  /**
   * Best definition for a word used as a particular word class.
   * Tries each candidate spelling in order (e.g. the word as written, then its root form).
   * Returns { lookedUp, info, meaning, best, matched } or null.
   */
  async function defineAs(candidates, cls) {
    const tried = new Set();
    let fallback = null;
    for (const c of candidates) {
      const w = cleanWord(c);
      if (!w || tried.has(w)) continue;
      tried.add(w);
      const info = await define(w);
      if (!info) continue;
      const wanted = cls === 'propernoun' ? ['propernoun', 'noun'] : [cls];
      const meaning = info.meanings.find((m) => wanted.includes(m.cls));
      if (meaning) return { lookedUp: w, info, meaning, best: pickBest(meaning.definitions), matched: true };
      if (!fallback) fallback = { lookedUp: w, info, meaning: info.meanings[0], best: pickBest(info.meanings[0].definitions), matched: false };
    }
    return fallback;
  }

  // prefer the first definition that has an example and is not too long
  function pickBest(defs) {
    const short = defs.slice(0, 4).filter((d) => d.definition.length < 160);
    return short.find((d) => d.example) || short[0] || defs[0];
  }

  /**
   * Synonyms for a word in a word class, most useful first.
   * Combines Datamuse synonyms with the dictionary's own list.
   */
  async function synonyms(word, cls, extra) {
    const w = cleanWord(word);
    if (!w || !THESAURUS_CLASSES.includes(cls)) return [];
    const out = [];
    const ok = (item) => {
      const tags = item.tags || [];
      const pos = tags.map((t) => MUSE_POS[t]).filter(Boolean);
      return !pos.length || pos.includes(cls);
    };
    const keep = (s) => {
      if (!s || s.toLowerCase() === w || s.split(' ').length > 2 || /[^a-z' -]/i.test(s)) return;
      addUnique(out, s);
    };
    (extra || []).forEach(keep);
    try {
      const syn = await getJSON(`${MUSE}words?rel_syn=${encodeURIComponent(w)}&md=pf&max=40`) || [];
      syn.filter(ok).sort(byUsefulness).forEach((x) => keep(x.word));
      if (out.length < 5) {
        const ml = await getJSON(`${MUSE}words?ml=${encodeURIComponent(w)}&md=pf&max=40`) || [];
        ml.filter((x) => ok(x) && (x.tags || []).some((t) => MUSE_POS[t] === cls) && x.score > 1000)
          .slice(0, 12).forEach((x) => keep(x.word));
      }
    } catch (e) {
      if (!out.length) throw e;
    }
    return out.slice(0, 12);
  }

  // common words first, so children see words they are likely to know
  function byUsefulness(a, b) {
    return freq(b) - freq(a);
  }
  function freq(x) {
    const f = (x.tags || []).find((t) => /^f:/.test(t));
    const n = f ? parseFloat(f.slice(2)) : 0;
    return Math.min(n, 60) + (x.score || 0) / 5000;   // don't let very common words crowd everything out
  }

  /** Thesaurus extras for the Vocabulary Corner. */
  async function thesaurus(word) {
    const w = cleanWord(word);
    const [syn, ant, describe, describes] = await Promise.all([
      getJSON(`${MUSE}words?rel_syn=${encodeURIComponent(w)}&md=pf&max=60`).catch(() => []),
      getJSON(`${MUSE}words?rel_ant=${encodeURIComponent(w)}&md=p&max=20`).catch(() => []),
      getJSON(`${MUSE}words?rel_jjb=${encodeURIComponent(w)}&md=f&max=30`).catch(() => []),  // adjectives used to describe a noun
      getJSON(`${MUSE}words?rel_jja=${encodeURIComponent(w)}&md=f&max=30`).catch(() => []),  // nouns an adjective describes
    ]);
    const grouped = {};
    (syn || []).sort(byUsefulness).forEach((x) => {
      const cls = (x.tags || []).map((t) => MUSE_POS[t]).find(Boolean) || 'other';
      if (cls === 'propernoun' || / .* /.test(x.word)) return;
      (grouped[cls] = grouped[cls] || []).push(x.word);
    });
    const words = (list) => (list || []).map((x) => x.word).filter((s) => !/\s/.test(s));
    return {
      synonyms: grouped,
      antonyms: words(ant),
      describedBy: words((describe || []).sort(byUsefulness)).slice(0, 16),
      describes: words((describes || []).sort(byUsefulness)).slice(0, 16),
    };
  }

  /** Spelling suggestions ("Did you mean…?") */
  async function suggest(word) {
    const w = cleanWord(word);
    if (!w) return [];
    const res = await getJSON(`${MUSE}sug?s=${encodeURIComponent(w)}&max=8`).catch(() => []);
    return (res || []).map((x) => x.word).filter((s) => s !== w && !/\s/.test(s));
  }

  // =================================================== upper primary extras
  const WIKT = 'https://en.wiktionary.org/api/rest_v1/page/definition/';

  /** How common a word is: occurrences per million words (Datamuse), or null if unknown. */
  async function frequency(word) {
    const w = cleanWord(word);
    if (!w) return null;
    const res = await getJSON(`${MUSE}words?sp=${encodeURIComponent(w)}&md=f&max=1`).catch(() => null);
    const hit = (res || []).find((x) => x.word === w);
    return hit ? freqOf(hit) : null;
  }
  function freqOf(x) {
    const f = (x.tags || []).find((t) => /^f:/.test(t));
    return f ? parseFloat(f.slice(2)) : null;
  }
  async function isWord(w, min) {
    const f = await frequency(w);
    return f != null && f >= (min == null ? 0.5 : min);
  }

  /** Sort a word into a challenge level from how often it is used. */
  function tierOf(f) {
    if (f == null) return 'ambitious';
    if (f >= 12) return 'everyday';
    if (f >= 1.5) return 'ambitious';
    return 'challenge';
  }

  /**
   * Lots of synonyms for one word class, each with how common it is.
   * Returns [{ word, f, tier }]. Very obscure words are left out.
   */
  async function richSynonyms(word, cls, opts) {
    const o = opts || {};
    const w = cleanWord(word);
    if (!w || !THESAURUS_CLASSES.includes(cls)) return [];
    const bases = Array.from(new Set([w].concat(o.bases || []).map(cleanWord).filter(Boolean)));
    const found = new Map();      // word -> f
    const fits = (x) => (x.tags || []).some((t) => MUSE_POS[t] === cls);
    const okWord = (s) => s && !bases.includes(s.toLowerCase()) && s.split(' ').length <= 2 && !/[^a-z' -]/i.test(s);
    const add = (s, f) => { if (okWord(s) && !found.has(s)) found.set(s, f); };

    const lists = await Promise.all(bases.flatMap((b) => [
      getJSON(`${MUSE}words?rel_syn=${encodeURIComponent(b)}&md=pf&max=80`).catch(() => []),
      getJSON(`${MUSE}words?ml=${encodeURIComponent(b)}&md=pf&max=100`).catch(() => []),
    ]));
    lists.forEach((list, i) => {
      const isMl = i % 2 === 1;
      const top = list && list[0] ? list[0].score || 1 : 1;
      (list || []).forEach((x) => {
        if (!fits(x)) return;
        if (isMl && (x.score || 0) < top * 0.35) return;    // "means like" gets loose further down the list
        add(x.word, freqOf(x));
      });
    });
    // synonyms from the dictionary, with their frequency looked up
    const extra = (o.extra || []).filter((s) => okWord(s) && !found.has(s)).slice(0, 15);
    const fs = await Promise.all(extra.map((s) => frequency(s).catch(() => null)));
    extra.forEach((s, i) => add(s, fs[i]));

    return Array.from(found, ([s, f]) => ({ word: s, f, tier: tierOf(f) }))
      .filter((x) => x.f == null || x.f >= 0.08)
      .sort((a, b) => (b.f || 0) - (a.f || 0));
  }

  /** Words often found just before / after this word ("absolutely petrified", "petrified of") */
  const FILLER = new Set('a an the and or but i you he she it we they me him her us them my your his its our their this that these those is are was were be been am to there then so as if s t'.split(' '));
  async function phrases(word) {
    const w = cleanWord(word);
    const [before, after] = await Promise.all([
      getJSON(`${MUSE}words?rel_bgb=${encodeURIComponent(w)}&md=f&max=40`).catch(() => []),
      getJSON(`${MUSE}words?rel_bga=${encodeURIComponent(w)}&md=f&max=40`).catch(() => []),
    ]);
    const pick = (list) => (list || []).map((x) => x.word).filter((s) => /^[a-z]+$/.test(s) && !FILLER.has(s)).slice(0, 6);
    return [
      ...pick(before).map((b) => ({ text: `${b} ${w}`, other: b })),
      ...pick(after).map((a) => ({ text: `${w} ${a}`, other: a })),
    ];
  }

  /** Other members of the word's family that share its stem (petrify, petrifying, petrification…) */
  const FAMILY_END = /^(e|y|s|es|ed|ied|ies|ier|iest|ily|iness|ing|ying|er|ers|est|ly|ness|ful|fully|less|ment|ments|ion|ions|tion|ation|ication|ification|ifications|action|able|ably|ible|ibly|ous|ously|ious|iously|ive|ively|ity|ities|al|ally|ise|ised|ising|ize|ized|izing|ify|ifies|ified|ifying|ism|ist|ists|ish|ance|ence|ant|ent|ence|ery|ic|ical|ically)?$/;
  async function family(base) {
    const b = cleanWord(base);
    const stem = b.replace(/(e|y|ed|ied|ing)$/, '');
    if (stem.length < 4 || /\s/.test(b)) return [];
    const res = await getJSON(`${MUSE}words?sp=${encodeURIComponent(stem)}*&md=pf&max=80`).catch(() => []);
    return (res || [])
      .filter((x) => FAMILY_END.test(x.word.slice(stem.length)) && (freqOf(x) || 0) >= 0.2)
      .map((x) => ({ word: x.word, cls: (x.tags || []).map((t) => MUSE_POS[t]).find(Boolean) || 'other', f: freqOf(x) }))
      .sort((a, c) => a.word.length - c.word.length)
      .slice(0, 12);
  }

  /** Extra example sentences from Wiktionary, by word class: { adjective: ['...'], verb: [...] } */
  async function examples(word) {
    const w = cleanWord(word);
    const data = await getJSON(WIKT + encodeURIComponent(w)).catch(() => null);
    const out = {};
    ((data && data.en) || []).forEach((entry) => {
      const cls = POS_MAP[lower(entry.partOfSpeech)] || null;
      if (!cls) return;
      (entry.definitions || []).forEach((d) => {
        const list = (d.parsedExamples || []).map((e) => e.example).concat(d.examples || []);
        list.forEach((html) => {
          const text = stripHtml(html);
          if (text.length >= 15 && text.length <= 220 && !/[{}|]/.test(text)) {
            (out[cls] = out[cls] || []);
            if (!out[cls].includes(text)) out[cls].push(text);
          }
        });
      });
    });
    return out;
  }
  function lower(s) { return String(s || '').toLowerCase(); }
  function stripHtml(html) {
    const raw = String(html || '');
    if (typeof DOMParser !== 'undefined') {
      return tidy(new DOMParser().parseFromString(raw, 'text/html').body.textContent || '');
    }
    return tidy(raw.replace(/<[^>]*>/g, ''));
  }

  root.Lookup = {
    define, defineAs, synonyms, thesaurus, suggest, cleanWord, POS_MAP, british, britishText,
    frequency, isWord, tierOf, richSynonyms, phrases, family, examples,
  };
})(typeof self !== 'undefined' ? self : this);
