// Optional extra check: makes EVERY word form the app can generate and looks each one up
// in a British English dictionary, so no made-up words slip through.
//
// One-off setup (these two small packages are only used for this check, not by the website):
//   npm install --no-save nspell@2 dictionary-en-gb@3
// Then run:
//   node tests/dictionary-check.mjs
import nspell from 'nspell';
import gb from 'dictionary-en-gb';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const G = require('../js/grammar.js');
const LU = require('../js/levelup.js');

const spell = nspell(gb);
// real words this dictionary happens not to list
const ALLOW = new Set(['snigger', 'sniggered', 'sniggering', 'sniggers', 'prized', 'prizing', 'vicinities', 'gawped', 'gawping', 'gawps']);
const ok = (w) => ALLOW.has(w.toLowerCase()) || spell.correct(w) || spell.correct(w.toLowerCase()) ||
  (w.includes('-') && w.split('-').every((p) => spell.correct(p)));

const FORMS = { verb: ['past', 'ing', 'present3'], adjective: ['comparative', 'superlative'], noun: ['plural'], adverb: [] };
const bad = [];
let checked = 0;
for (const [key, e] of Object.entries(LU.ENTRIES)) {
  for (const tier of ['lower', 'ambitious', 'challenge']) {
    for (const w of e[tier]) {
      for (const form of FORMS[e.cls] || []) {
        if (e.cls === 'noun' && /s$/.test(w)) continue;      // already plural
        const out = LU.shape(w, form, G.inflect, false);
        if (out === null) continue;                          // correctly skipped ("more enormous")
        checked++;
        out.split(/\s+/).forEach((x) => { if (!ok(x)) bad.push(`${key} (${tier}): ${w} → ${form} → "${out}"`); });
      }
    }
  }
}
if (bad.length) {
  console.log(`${bad.length} word form(s) not found in the British dictionary:`);
  bad.forEach((b) => console.log('  ' + b));
  process.exit(1);
}
console.log(`All ${checked} generated word forms are real British English words.`);
