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
// The sample texts pupils see first must be coloured correctly
{
  const check = (text, want) => {
    const toks = G.analyse(text).tokens;
    for (const [w, cls] of Object.entries(want)) {
      const t = toks.find((x) => x.text === w);
      assert.ok(t, `"${w}" found in: ${text}`);
      assert.strictEqual(t.cls, cls, `"${w}" in: ${text}`);
    }
  };
  check('Mira grabbed her torch and raced down the winding path because she knew the fishing boats needed help.', { boats: 'noun', needed: 'verb', winding: 'adjective' });
  check('When pressure builds up underground, hot melted rock called magma rises towards the surface.', { When: 'conjunction', pressure: 'noun', builds: 'verb', underground: 'adverb', rises: 'verb' });
  check('Some volcanoes erupt violently, but others ooze lava gently down their slopes.', { others: 'pronoun', ooze: 'verb', lava: 'noun', erupt: 'verb' });
  check('The proud crow opened her beak to sing, and the cheese fell straight into the clever fox\'s mouth. Oh dear!', { straight: 'adverb', Oh: 'interjection', dear: 'interjection', proud: 'adjective' });
  check('When did you arrive?', { When: 'adverb' });
  check('She walked down the straight road. He was fast.', { straight: 'adjective', fast: 'adjective' });
  check('Dear Sam, thank you for the present.', { Sam: 'propernoun' });
  console.log('Sample text checks passed.');
}

// Words fetched online use British spellings
{
  const L = require('../js/lookup.js').Lookup;
  const want = { fossilized: 'fossilised', realized: 'realised', paralyze: 'paralyse', color: 'colour', gray: 'grey',
    canceled: 'cancelled', emphasize: 'emphasise', size: 'size', prize: 'prize', seize: 'seize', capsize: 'capsize' };
  for (const [us, uk] of Object.entries(want)) assert.strictEqual(L.british(us), uk, us);
  assert.strictEqual(L.britishText('The gray stone was fossilized.'), 'The grey stone was fossilised.');
  console.log('British spelling checks passed.');
}

// Word forms: never invent words (audit: "petrifiedded", "pept", "gladest", "more enormous")
const W = require('../js/wordforms.js');
const VERBS = {
  peep: 'peeped peeping peeps', hoot: 'hooted hooting hoots', keel: 'keeled keeling keels',
  murmur: 'murmured murmuring murmurs', gallop: 'galloped galloping gallops', gawp: 'gawped gawping gawps',
  tiptoe: 'tiptoed tiptoeing tiptoes', spring: 'sprang springing springs', cling: 'clung clinging clings',
  slink: 'slunk slinking slinks', sneak: 'sneaked sneaking sneaks', dive: 'dived diving dives', ski: 'skied skiing skis',
  travel: 'travelled travelling travels', panic: 'panicked panicking panics', stop: 'stopped stopping stops',
  run: 'ran running runs', make: 'made making makes', cry: 'cried crying cries', go: 'went going goes',
  tie: 'tied tying ties', flee: 'fled fleeing flees', petrify: 'petrified petrifying petrifies',
  visit: 'visited visiting visits', begin: 'began beginning begins', whisper: 'whispered whispering whispers',
};
for (const [v, forms] of Object.entries(VERBS)) {
  assert.deepStrictEqual(['past', 'ing', 'present3'].map((f) => W.verbForm(v, f)).join(' '), forms, v);
}
const ADJ = { glad: 'gladder', dim: 'dimmer', glum: 'glummer', sad: 'sadder', grey: 'greyer', cruel: 'crueller',
  big: 'bigger', happy: 'happier', gentle: 'gentler', good: 'better', bad: 'worse', sombre: 'more sombre', worn: 'more worn' };
for (const [a, c] of Object.entries(ADJ)) assert.strictEqual(W.compare(a, 'comparative'), c, a);
['enormous', 'huge', 'giant', 'colossal', 'furious', 'spent'].forEach((a) => assert.strictEqual(W.compare(a, 'comparative'), null, a));
const BASES = { petrified: 'petrify', stopped: 'stop', ran: 'run', whispered: 'whisper', gleaming: 'gleam', crying: 'cry',
  made: 'make', went: 'go', swam: 'swim', hopped: 'hop', hoped: 'hope', tied: 'tie', studied: 'study', panicked: 'panic',
  travelled: 'travel', galloped: 'gallop', dying: 'die', excited: 'excite', spilled: 'spill', hissed: 'hiss', focus: 'focus' };
for (const [w, b] of Object.entries(BASES)) assert.strictEqual(G.baseVerb(w), b, w);
assert.strictEqual(G.conjugate('petrified').past, 'petrified');
assert.strictEqual(G.conjugate('petrified').ing, 'petrifying');
console.log('Word form checks passed.');

// Level Up! spots plain words and shapes the suggestions to fit
const LU = require('../js/levelup.js');
{
  const a = G.analyse('"Help!" said Sam. Then he went home. It was a very big dog. I am going to win. She got up.');
  const units = LU.findUnits(a).map((u) => u.ids.map((i) => a.tokens[i].text).join(' ') + ':' + u.key);
  assert.deepStrictEqual(units, ['said:say', 'Then:then', 'went:go', 'very big:big']);
  const said = LU.findUnits(a)[0];
  assert.ok(LU.suggestions(said, 'upper', G.inflect)[0].words.includes('bellowed'));
  assert.ok(LU.suggestions(said, 'lower', G.inflect)[0].words.includes('shouted'));
  assert.strictEqual(LU.shape('colossal', 'comparative', G.inflect), null, 'extreme words are not compared');
  assert.strictEqual(LU.shape('gloomy', 'comparative', G.inflect), 'gloomier');
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

// Alan Peat sentences: every example passes its own checklist
const P = require('../js/peat.js');
assert.strictEqual(P.TYPES.length, 22);
P.TYPES.forEach((t) => t.examples.forEach((e) => {
  const failed = P.check(t, P.plain(e), G).filter((r) => r.ok === false);
  assert.deepStrictEqual(failed, [], `${t.id}: "${P.plain(e)}"`);
}));
const find = (id) => P.TYPES.find((t) => t.id === id);
assert.ok(P.check(find('boys'), 'I was tired so I slept.', G).some((r) => r.ok === false), 'BOYS needs a comma');
assert.ok(P.check(find('3bad'), 'Pain, fear, hunger – what next.', G).some((r) => r.ok === false), '3 bad needs a question mark');
console.log('Alan Peat sentence checks passed.');

// Pre-recorded audio: every fixed example should have a recording
{
  const fs = require('fs');
  const path = require('path');
  const A = require('../js/audioclips.js');
  const idx = path.join(__dirname, '..', 'audio', 'index.json');
  if (fs.existsSync(idx)) {
    const clips = JSON.parse(fs.readFileSync(idx, 'utf8')).clips;
    const all = [...F.DEVICES.flatMap((d) => d.examples.map((e) => F.plain(e.t))), ...P.TYPES.flatMap((t) => t.examples.map((e) => P.plain(e)))];
    const missing = all.filter((t) => !clips[A.key(t)] || !fs.existsSync(path.join(__dirname, '..', 'audio', clips[A.key(t)])));
    if (missing.length) console.log(`Note: ${missing.length} example(s) have no recording yet and will use the device voice. Run tools/make-audio.mjs to record them.`);
    else console.log(`Audio checks passed (${all.length} recordings).`);
  }
}

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
