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
      return res.json();
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
    return String(s).replace(/\s+/g, ' ').trim();
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

  root.Lookup = { define, defineAs, synonyms, thesaurus, suggest, cleanWord, POS_MAP };
})(typeof self !== 'undefined' ? self : this);
