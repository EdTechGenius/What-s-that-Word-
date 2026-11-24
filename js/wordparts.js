/*
 * wordparts.js — "word detective": splits a word into prefix / root / suffix
 * and explains what each part means, e.g.
 *   petrified = petr (rock) + -ify (to make or become) + -ed
 * A part is only shown when what is left is a real word (checked with the
 * isWord function passed in), or a known Greek/Latin root.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WordParts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PREFIXES = {
    anti: 'against', auto: 'self', bi: 'two', co: 'together', de: 'down, away or undo', dis: 'not, or the opposite of',
    ex: 'out of, or former', fore: 'before', il: 'not', im: 'not, or into', in: 'not, or into', inter: 'between',
    ir: 'not', micro: 'very small', mid: 'middle', mis: 'wrongly or badly', multi: 'many', non: 'not',
    over: 'too much, or above', post: 'after', pre: 'before', re: 'again or back', semi: 'half', sub: 'under or below',
    super: 'above or beyond', tele: 'far away', trans: 'across', tri: 'three', un: 'not, or the opposite of',
    under: 'too little, or below',
  };

  // [suffix, meaning, function giving possible base words from the stem]
  const y = (s) => s.replace(/i$/, 'y');
  const undouble = (s) => (/([bdgklmnprt])\1$/.test(s) ? s.slice(0, -1) : s);
  const SUFFIXES = [
    ['ification', 'the process of making something', (s) => [s + 'ify']],
    ['ation', 'the act or result of doing something', (s) => [s, s + 'e', s + 'ate']],
    ['ition', 'the act or result of doing something', (s) => [s, s + 'e']],
    ['ion', 'the act or result of doing something', (s) => [s, s + 'e']],
    ['ness', 'the state of being', (s) => [s, y(s)]],
    ['ment', 'the act or result of', (s) => [s, y(s)]],
    ['fully', 'in a way that is full of', (s) => [s, y(s)]],
    ['ful', 'full of', (s) => [s, y(s)]],
    ['lessly', 'in a way that is without', (s) => [s, y(s)]],
    ['less', 'without', (s) => [s, y(s)]],
    ['ably', 'in a way that can be', (s) => [s, s + 'e']],
    ['able', 'can be done', (s) => [s, s + 'e', y(s)]],
    ['ible', 'can be done', (s) => [s, s + 'e']],
    ['ously', 'in a way that is full of', (s) => [s, s + 'e', y(s)]],
    ['ous', 'full of, or having', (s) => [s, s + 'e', y(s), s.replace(/i$/, '')]],
    ['ive', 'tending to, or doing', (s) => [s, s + 'e']],
    ['ity', 'the state or quality of', (s) => [s, s + 'e']],
    ['ise', 'to make or become', (s) => [s, s + 'y']],
    ['ize', 'to make or become', (s) => [s, s + 'y']],
    ['ify', 'to make or become', (s) => [s, s + 'e']],
    ['ily', 'in a ___ way', (s) => [s + 'y']],
    ['ly', 'in a ___ way', (s) => [s, y(s), s + 'le', s + 'e']],
    ['ied', 'done in the past, or describes how someone feels', (s) => [s + 'y']],
    ['ed', 'done in the past, or describes how someone feels', (s) => [s, s + 'e', undouble(s)]],
    ['ing', 'happening now, or the name of an activity', (s) => [s, s + 'e', undouble(s)]],
    ['ist', 'a person who does or believes', (s) => [s, s + 'y', s + 'e']],
    ['ism', 'a belief or way of behaving', (s) => [s, s + 'e']],
    ['ish', 'a little bit, or rather like', (s) => [s, s + 'e', undouble(s)]],
    ['hood', 'the state or time of being', (s) => [s]],
    ['ship', 'the state or skill of being', (s) => [s]],
    ['ance', 'the act or state of', (s) => [s, s + 'e']],
    ['ence', 'the act or state of', (s) => [s, s + 'e']],
    ['ical', 'to do with', (s) => [s + 'ic', s + 'y']],
    ['al', 'to do with', (s) => [s, s + 'e']],
    ['ic', 'to do with, or like', (s) => [s, s + 'y']],
    ['est', 'the most', (s) => [s, s + 'e', y(s), undouble(s)]],
    ['er', 'a person or thing that does, or more', (s) => [s, s + 'e', y(s), undouble(s)]],
    ['or', 'a person or thing that does', (s) => [s, s + 'e']],
    ['y', 'full of, or like', (s) => [s, s + 'e', undouble(s)]],
  ];

  // Greek and Latin roots that children meet often
  const ROOTS = {
    aqua: ['water', 'Latin'], aqu: ['water', 'Latin'], astro: ['star', 'Greek'], aster: ['star', 'Greek'],
    audi: ['hear', 'Latin'], bene: ['good, well', 'Latin'], bio: ['life', 'Greek'], chron: ['time', 'Greek'],
    cred: ['believe', 'Latin'], cycl: ['circle or wheel', 'Greek'], dict: ['say', 'Latin'], duct: ['lead', 'Latin'],
    dyna: ['power', 'Greek'], fract: ['break', 'Latin'], frag: ['break', 'Latin'], geo: ['earth', 'Greek'],
    graph: ['write or draw', 'Greek'], hydr: ['water', 'Greek'], ject: ['throw', 'Latin'], liber: ['free', 'Latin'],
    lumin: ['light', 'Latin'], magn: ['great, large', 'Latin'], manu: ['hand', 'Latin'], metr: ['measure', 'Greek'],
    migr: ['move', 'Latin'], mort: ['death', 'Latin'], nov: ['new', 'Latin'], ped: ['foot', 'Latin'],
    petr: ['rock or stone', 'Greek “petra”'], phon: ['sound', 'Greek'], photo: ['light', 'Greek'], port: ['carry', 'Latin'],
    rupt: ['break', 'Latin'], scop: ['look at', 'Greek'], scrib: ['write', 'Latin'], script: ['write', 'Latin'],
    spect: ['look', 'Latin'], struct: ['build', 'Latin'], therm: ['heat', 'Greek'], tract: ['pull or drag', 'Latin'],
    vid: ['see', 'Latin'], vis: ['see', 'Latin'], voc: ['voice or call', 'Latin'], viv: ['alive', 'Latin'],
    zoo: ['animal', 'Greek'], terr: ['frighten (as in terrify) or land (as in territory)', 'Latin'], horr: ['bristle with fear', 'Latin'],
    trem: ['shake', 'Latin'], feroc: ['wild, fierce', 'Latin'], lun: ['moon', 'Latin'], sol: ['sun', 'Latin'],
  };
  // roots that only count when they start a word with nothing missing (avoid "solid", "terrace" etc.)
  const STRICT_ROOTS = new Set(['sol', 'terr', 'lun', 'nov', 'ped', 'vis', 'vid', 'port', 'zoo']);

  /**
   * Analyse a word. isWord(w) -> Promise<boolean>.
   * Returns { parts: [{ type: 'prefix'|'root'|'base'|'suffix', text, meaning, origin }], base }
   */
  // peel suffixes off the end until a real word (or a known root) is left
  async function peel(word, isWord) {
    const suffixes = [];
    let w = word;
    let rootPart = null;
    for (let layer = 0; layer < 3 && !rootPart; layer++) {
      let peeled = false;
      for (const [suf, meaning, bases] of SUFFIXES) {
        if (!w.endsWith(suf) || w.length - suf.length < 3) continue;
        const stem = w.slice(0, -suf.length);
        const cands = Array.from(new Set(bases(stem))).filter((c) => c.length >= 3 && c !== w);
        let base = null;
        for (const c of cands) {
          // eslint-disable-next-line no-await-in-loop
          if (await isWord(c)) { base = c; break; }
        }
        if (base) {
          suffixes.unshift({ type: 'suffix', text: '-' + (suf === 'ied' ? 'ed' : suf), meaning });
          w = base;
          peeled = true;
          break;
        }
        const r = ROOTS[stem];
        if (r) {   // a Greek/Latin root on its own: petr + ify
          suffixes.unshift({ type: 'suffix', text: '-' + suf, meaning });
          rootPart = { type: 'root', text: stem, meaning: r[0], origin: r[1] };
          w = stem;
          peeled = true;
          break;
        }
      }
      if (!peeled) break;
    }
    return { suffixes, base: w, rootPart };
  }

  async function findPrefix(w, isWord) {
    const byLength = Object.keys(PREFIXES).sort((a, b) => b.length - a.length);
    for (const p of byLength) {
      if (!w.startsWith(p) || w.length - p.length < 4) continue;
      const rest = w.slice(p.length);
      // eslint-disable-next-line no-await-in-loop
      if (await isWord(rest, 4)) return { prefix: p, rest, peel: null };
      // eslint-disable-next-line no-await-in-loop
      const r = await peel(rest, isWord);
      if (r.suffixes.length) return { prefix: p, rest: r.base, peel: r };
    }
    return null;
  }

  function rootIn(w, allowStrict) {
    const key = Object.keys(ROOTS).sort((a, b) => b.length - a.length)
      .find((r) => w.startsWith(r) && (w === r || w.length - r.length >= 2) && (allowStrict || !STRICT_ROOTS.has(r)));
    return key ? { type: 'root', text: key, meaning: ROOTS[key][0], origin: ROOTS[key][1] } : null;
  }

  /**
   * Analyse a word. isWord(w, minFrequency) -> Promise<boolean>.
   * Returns { parts: [{ type: 'prefix'|'root'|'base'|'suffix', text, meaning, origin }], base }
   */
  async function analyse(word, isWord) {
    const w0 = String(word || '').toLowerCase().trim();
    if (!/^[a-z]{4,}$/.test(w0)) return { parts: [], base: w0 };

    let { suffixes, base, rootPart } = await peel(w0, isWord);
    let prefix = null;
    if (!rootPart) {
      const p = await findPrefix(base, isWord);
      if (p) {
        prefix = p.prefix;
        base = p.rest;
        if (p.peel) { suffixes = p.peel.suffixes.concat(suffixes); rootPart = p.peel.rootPart; }
      } else if (!suffixes.length) {
        const p2 = await findPrefix(w0, isWord);
        if (p2) { prefix = p2.prefix; base = p2.rest; if (p2.peel) { suffixes = p2.peel.suffixes; rootPart = p2.peel.rootPart; } }
      }
    }

    const parts = [];
    if (prefix) parts.push({ type: 'prefix', text: prefix + '-', meaning: PREFIXES[prefix] });
    if (rootPart) {
      parts.push(rootPart);
    } else {
      const r = rootIn(base, suffixes.length || prefix);
      const rest = r ? base.slice(r.text.length) : '';
      if (r && !rest) {
        parts.push(r);                                   // trans + port + ation
      } else if (r && !suffixes.length) {
        parts.push(r);                                   // spect + ator
        suffixes.push({ type: 'suffix', text: '-' + rest, meaning: '' });
      } else if (suffixes.length || prefix) {
        parts.push({ type: 'base', text: base, meaning: 'the base word' });
      }
    }
    const all = parts.concat(suffixes);
    return { parts: all.length > 1 ? all : [], base };
  }

  return { analyse };
});
