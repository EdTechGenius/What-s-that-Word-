// Quick checks for the grammar engine: node tests/grammar.test.js
const G = require('../js/grammar.js');
const assert = require('assert');

const text = `Marcus woke before the sun, as he did every morning, to the sound of the trumpet. Outside, soldiers were already lining up in neat rows, their helmets gleaming in the grey light.

His father, who was a centurion, was in charge of eighty men. He was strict but fair, and the soldiers respected him. "Don't go!" she shouted. Wow! The well-made toys were bigger. I gave her the book because she asked.`;

const a = G.analyse(text);
// the original text must be rebuilt exactly from the tokens
const rebuilt = a.paragraphs.map((p) => p.tokens.map((t) => t.pre + t.text + t.post).join('')).join('\n');
const norm = (s) => s.replace(/\s+/g, ' ').trim();
assert.strictEqual(norm(rebuilt), norm(text), 'text rebuilt');

const got = {};
a.tokens.forEach((t) => { got[t.text + '#' + (got[t.text + '#0'] ? 1 : 0)] = t.cls; });
const verbose = process.argv.includes('-v');
if (verbose) a.tokens.forEach((t) => console.log(t.text.padEnd(12), t.cls.padEnd(12), t.sub || ''));

const expect = {
  'Marcus#0': 'propernoun', 'woke#0': 'verb', 'before#0': 'preposition', 'the#0': 'determiner', 'sun#0': 'noun',
  'as#0': 'conjunction', 'he#0': 'pronoun', 'every#0': 'determiner', 'Outside#0': 'adverb', 'already#0': 'adverb',
  'up#0': 'adverb', 'neat#0': 'adjective', 'their#0': 'determiner', 'grey#0': 'adjective', 'His#0': 'determiner',
  'who#0': 'pronoun', 'eighty#0': 'determiner', 'strict#0': 'adjective', 'but#0': 'conjunction', 'him#0': 'pronoun',
  'Wow#0': 'interjection', 'well-made#0': 'adjective', "Don't#0": 'verb', 'her#0': 'pronoun', 'because#0': 'conjunction',
  'bigger#0': 'adjective',
};
let fails = 0;
for (const [k, v] of Object.entries(expect)) {
  if (got[k] !== v) { fails++; console.log('FAIL', k, 'expected', v, 'got', got[k]); }
}
// every token gets an explanation with at least one reason
a.tokens.forEach((t) => {
  const e = G.explain(a, t);
  assert.ok(e.reasons.length > 0, 'reasons for ' + t.text);
  assert.ok(e.meaning && e.sentence, 'meaning/sentence for ' + t.text);
  if (verbose) console.log('\n' + e.meaning + '\n  - ' + e.reasons.join('\n  - ') + (e.note ? '\n  * ' + e.note : '') + '\n  lookup=' + e.lookup + ' form=' + e.form);
});
assert.strictEqual(G.inflect('awaken', 'past'), 'awakened');
assert.strictEqual(G.inflect('warrior', 'plural'), 'warriors');
// Level Up! spots plain words and shapes the suggestions to fit
const LU = require('../js/levelup.js');
{
  const a = G.analyse('"Help!" said Sam. Then he went home. It was a very big dog. I am going to win. She got up.');
  const units = LU.findUnits(a).map((u) => u.ids.map((i) => a.tokens[i].text).join(' ') + ':' + u.key);
  assert.deepStrictEqual(units, ['said:say', 'Then:then', 'went:go', 'very big:big']);
  const said = LU.findUnits(a)[0];
  assert.ok(LU.suggestions(said, 'upper', G.inflect)[0].words.includes('bellowed'));
  assert.ok(LU.suggestions(said, 'lower', G.inflect)[0].words.includes('shouted'));
  assert.strictEqual(LU.shape('colossal', 'comparative', G.inflect), 'more colossal');
  assert.strictEqual(LU.shape('gallop', 'past', G.inflect), 'galloped');
  // more ways to level up: where adverbs, openers and conjunctions can go
  const b = G.analyse('"Who is there?" said Sam. He walked into the dark house. The dog ate its dinner. It was cold.');
  const adv = LU.adverbSlots(b);
  const T = b.tokens;
  assert.deepStrictEqual(Object.values(adv).map((x) => `${T[x.verb].text}:${x.pos}:${T[x.at].text}:${x.group}`),
    ['said:after:Sam:speech', 'walked:after:walked:move', 'ate:before:ate:eat']);
  assert.deepStrictEqual(Object.values(LU.openerSlots(b)).map((i) => T[i].text), ['He', 'The', 'It']);
  const cj = LU.conjunctionSlots(b);
  assert.ok(Object.values(cj).some((x) => T[x.last].text === 'house' && x.join));
  assert.ok(LU.conjunctionsFor('upper').subordinating.includes('although'));
  console.log('Level Up checks passed.');
}

// Figurative Language Corner content and checks
const F = require('../js/figurative.js');
assert.strictEqual(F.DEVICES.length, 11);
F.DEVICES.forEach((d) => d.examples.forEach((e) => {
  assert.ok(/\[\[.+?\]\]/.test(e.t), `${d.id}: example has a highlighted part`);
  assert.ok(e.m && e.u, `${d.id}: example has a meaning and a use`);
  e.tags.forEach((t) => assert.ok(F.THEMES[t], `known theme ${t}`));
}));
assert.ok(F.check('simile', 'as brave as a lion').ok);
assert.ok(!F.check('simile', 'The lion was brave').ok);
assert.ok(F.check('alliteration', 'Seven silly snakes').ok);
assert.ok(F.check('onomatopoeia', 'The bacon sizzled').ok);
assert.strictEqual(F.check('idiom', 'anything'), null);
console.log('Figurative language checks passed.');

// word parts (with a tiny pretend dictionary)
const WP = require('../js/wordparts.js');
const known = new Set(['petrify', 'happy', 'unhappy', 'hope', 'port', 'transport', 'comfortable']);
(async () => {
  const show = async (w) => (await WP.analyse(w, async (x) => known.has(x))).parts.map((p) => p.text).join(' + ');
  assert.strictEqual(await show('petrified'), 'petr + -ify + -ed');
  assert.strictEqual(await show('unhappiness'), 'un- + happy + -ness');
  assert.strictEqual(await show('transportation'), 'trans- + port + -ation');
  assert.strictEqual(await show('table'), '');
  console.log('Word part checks passed.');
})().catch((e) => { console.error(e); process.exit(1); });

if (fails) { console.log(fails + ' word class check(s) failed'); process.exit(1); }
console.log('All grammar checks passed (' + a.tokens.length + ' words).');
