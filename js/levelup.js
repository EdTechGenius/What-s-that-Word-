/*
 * levelup.js — finds "plain" words in a pupil's writing and suggests
 * better words to swap in, at two levels:
 *   lower primary: one list of more interesting words
 *   upper primary: ✨ ambitious and 🚀 challenge words
 * Suggestions are stored in their base form (shout, huge) and changed to
 * match the pupil's word (said -> shouted, bigger -> huger/larger).
 * Works in the browser (window.LevelUp) and in Node for testing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LevelUp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const L = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
  const PARTICLES = ['up', 'down', 'in', 'out', 'off', 'on', 'away', 'back', 'over', 'round', 'around', 'through', 'along', 'by'];

  // key: base form. why: shown to the pupil. avoid: when NOT to suggest a swap.
  const ENTRIES = {
    // ---------------------------------------------------------- verbs
    say: {
      cls: 'verb', why: '‘Said’ is used a lot! A more precise verb shows HOW something was said – loudly, quietly, angrily…',
      lower: L('shout, whisper, ask, reply, yell, call, giggle'),
      ambitious: L('mutter, mumble, exclaim, scream, announce, sigh, snap, explain'),
      challenge: L('bellow, stammer, retort, murmur, enquire, declare, protest, splutter'),
    },
    go: {
      cls: 'verb', why: '‘Go’ and ‘went’ don’t tell us much. A better verb shows HOW someone moved – fast, slowly, nervously…',
      lower: L('run, walk, rush, hurry, climb, skip, dash'),
      ambitious: L('stroll, march, wander, race, creep, trudge, scurry'),
      challenge: L('amble, saunter, venture, stagger, meander, stride, hurtle, clamber'),
      avoid: { next: ['off', 'on', 'out', 'bad', 'wrong', 'quiet', 'red', 'mad'], nextAdjective: true, goingTo: true },
    },
    get: {
      cls: 'verb', why: '‘Get’ and ‘got’ are very general. Try a verb that says exactly what happened.',
      lower: L('receive, find, collect, win, grab'),
      ambitious: L('earn, fetch, gather, obtain, catch'),
      challenge: L('acquire, retrieve, procure, attain, secure'),
      avoid: { next: PARTICLES.concat(['to', 'married', 'dressed', 'lost', 'ready', 'better', 'worse']), nextAdjective: true, nextVerb: true },
    },
    walk: {
      cls: 'verb', why: 'There are lots of ways to walk! Choose a verb that shows the mood of the character.',
      lower: L('stroll, march, stomp, tiptoe, wander'),
      ambitious: L('trudge, plod, stride, shuffle, creep, hike'),
      challenge: L('amble, saunter, traipse, meander, stagger, lumber'),
    },
    run: {
      cls: 'verb', why: 'A more precise verb paints a clearer picture of HOW someone ran.',
      lower: L('dash, race, rush, sprint, zoom'),
      ambitious: L('hurry, scurry, scamper, bolt, charge'),
      challenge: L('hurtle, scuttle, flee, gallop, scramble, stampede'),
      avoid: { next: ['out', 'into', 'over', 'away'] },
    },
    look: {
      cls: 'verb', why: 'How did they look? Quickly, angrily, carefully? Choose a verb that shows it.',
      lower: L('stare, peek, peep, watch, glance, gaze'),
      ambitious: L('glare, peer, squint, spot, notice, gawp'),
      challenge: L('scrutinise, survey, inspect, observe, examine, study'),
      avoid: { next: ['after', 'for', 'like', 'forward', 'as', 'up'], nextAdjective: true },
    },
    see: {
      cls: 'verb', why: '‘Saw’ is a very common word. A different verb can show how well or how quickly something was seen.',
      lower: L('spot, notice, find, watch, spy'),
      ambitious: L('glimpse, sight, observe, witness, detect'),
      challenge: L('discern, perceive, behold, distinguish, discover'),
      avoid: { next: ['you', 'ya'] },
    },
    eat: {
      cls: 'verb', why: 'HOW did they eat? Hungrily, politely, noisily? Pick a verb that shows it.',
      lower: L('munch, gobble, chew, nibble, crunch'),
      ambitious: L('devour, gulp, scoff, chomp, feast'),
      challenge: L('gorge, wolf, guzzle, consume, savour, relish'),
    },
    like: {
      cls: 'verb', why: 'Show HOW MUCH someone likes something with a stronger verb.',
      lower: L('love, enjoy, adore'),
      ambitious: L('admire, treasure, cherish, relish'),
      challenge: L('appreciate, idolise, savour, prize'),
      avoid: { next: ['to'] },
    },
    make: {
      cls: 'verb', why: '‘Make’ can mean lots of things. A more exact verb tells the reader what really happened.',
      lower: L('build, create, draw, bake, cook'),
      ambitious: L('construct, design, craft, produce, invent'),
      challenge: L('assemble, fashion, devise, forge, manufacture'),
      avoid: { next: PARTICLES.concat(['sure', 'me', 'you', 'him', 'her', 'us', 'them', 'it', 'friends', 'sense']) },
    },
    laugh: {
      cls: 'verb', why: 'There are many kinds of laugh! Choose one that shows how funny it was.',
      lower: L('giggle, chuckle, snigger, cackle'),
      ambitious: L('chortle, guffaw, titter, snort, howl'),
      challenge: L('roar, hoot, snicker, cackle'),
    },
    hit: {
      cls: 'verb', why: 'How hard was it? Pick a verb that shows the force.',
      lower: L('bash, smack, slap, punch, knock'),
      ambitious: L('strike, thump, whack, wallop, swipe'),
      challenge: L('pummel, clobber, batter, pound'),
    },
    fall: {
      cls: 'verb', why: 'How did they fall? Slowly, suddenly, dramatically? Show it with your verb.',
      lower: L('trip, tumble, slip, drop, crash'),
      ambitious: L('stumble, topple, plummet, collapse, sprawl'),
      challenge: L('plunge, descend, crumple, slump, cascade'),
      avoid: { next: ['asleep', 'in', 'out', 'for', 'apart', 'behind'] },
    },
    jump: {
      cls: 'verb', why: 'Was it a little hop or a giant leap? Choose a verb that shows it.',
      lower: L('hop, leap, skip, bounce, spring'),
      ambitious: L('bound, vault, pounce, lunge'),
      challenge: L('catapult, launch, hurdle, spring'),
    },
    think: {
      cls: 'verb', why: 'A more precise thinking verb shows how carefully or how sure someone was.',
      lower: L('wonder, guess, imagine, believe'),
      ambitious: L('consider, suppose, reckon, ponder'),
      challenge: L('contemplate, deliberate, reflect, speculate, presume'),
    },

    // ------------------------------------------------------ adjectives
    big: {
      cls: 'adjective', why: 'How big? An ambitious adjective helps the reader picture the size.',
      lower: L('huge, giant, enormous, massive, large'),
      ambitious: L('gigantic, immense, towering, vast, hefty, bulky'),
      challenge: L('colossal, mammoth, monumental, gargantuan, titanic, mountainous'),
    },
    small: {
      cls: 'adjective', why: 'How small? A more precise adjective helps the reader picture it.',
      lower: L('tiny, dainty, slight, teeny'),
      ambitious: L('miniature, petite, puny, compact, minute'),
      challenge: L('microscopic, minuscule, diminutive, infinitesimal, meagre'),
    },
    nice: {
      cls: 'adjective', why: '‘Nice’ is a very plain word – it doesn’t tell the reader much. What was it really like?',
      lower: L('lovely, pleasant, kind, friendly, cheerful'),
      ambitious: L('delightful, charming, thoughtful, enjoyable, glorious'),
      challenge: L('exquisite, splendid, agreeable, considerate, idyllic, magnificent'),
    },
    good: {
      cls: 'adjective', why: '‘Good’ is used so often that it loses its power. Try a word that shows HOW good.',
      lower: L('great, brilliant, super, fantastic, excellent'),
      ambitious: L('wonderful, marvellous, superb, outstanding, terrific'),
      challenge: L('exceptional, impeccable, exemplary, sublime, first-rate'),
      avoid: { next: ['at', 'morning', 'afternoon', 'evening', 'night', 'luck', 'bye'] },
    },
    bad: {
      cls: 'adjective', why: 'How bad was it? A stronger adjective shows the reader.',
      lower: L('awful, horrible, nasty, terrible, naughty'),
      ambitious: L('dreadful, dire, wicked, appalling, rotten'),
      challenge: L('atrocious, abysmal, abominable, dismal, vile, deplorable'),
    },
    happy: {
      cls: 'adjective', why: 'How happy? Show the strength of the feeling with a precise adjective.',
      lower: L('cheerful, glad, joyful, excited, pleased'),
      ambitious: L('delighted, thrilled, overjoyed, content, merry'),
      challenge: L('ecstatic, elated, jubilant, euphoric, exuberant, gleeful'),
      avoid: { next: ['birthday', 'christmas', 'new', 'easter', 'holidays'] },
    },
    sad: {
      cls: 'adjective', why: 'How sad? A precise adjective helps the reader feel it too.',
      lower: L('upset, unhappy, gloomy, miserable, glum'),
      ambitious: L('heartbroken, downcast, tearful, sorrowful, dejected'),
      challenge: L('melancholy, despondent, forlorn, crestfallen, woeful, disheartened'),
    },
    scared: {
      cls: 'adjective', why: 'How scared? Build tension with a stronger feeling word.',
      lower: L('afraid, frightened, nervous, worried, terrified'),
      ambitious: L('petrified, alarmed, fearful, shaken, anxious'),
      challenge: L('panic-stricken, horrified, apprehensive, aghast, unnerved'),
    },
    angry: {
      cls: 'adjective', why: 'How angry? Choose a word that shows how strong the feeling is.',
      lower: L('cross, grumpy, furious, annoyed'),
      ambitious: L('irritated, livid, fuming, enraged, outraged'),
      challenge: L('incensed, irate, seething, indignant, infuriated, exasperated'),
    },
    cold: {
      cls: 'adjective', why: 'How cold? Help the reader feel the temperature.',
      lower: L('chilly, freezing, icy, frosty, cool'),
      ambitious: L('bitter, wintry, raw, nippy, arctic'),
      challenge: L('glacial, frigid, polar, biting, numbing'),
    },
    hot: {
      cls: 'adjective', why: 'How hot? Help the reader feel the heat.',
      lower: L('warm, boiling, baking, burning, toasty'),
      ambitious: L('scorching, sweltering, blazing, roasting, steamy'),
      challenge: L('sultry, searing, blistering, tropical, stifling'),
    },
    fast: {
      cls: 'adjective', why: 'How fast? A more vivid word shows the speed.',
      lower: L('speedy, rapid, swift, nippy'),
      ambitious: L('brisk, hasty, nimble, hurried'),
      challenge: L('breakneck, supersonic, meteoric, headlong, whirlwind'),
    },
    slow: {
      cls: 'adjective', why: 'How slow? Choose a word that helps the reader feel the pace.',
      lower: L('sluggish, lazy, steady, gentle'),
      ambitious: L('leisurely, plodding, unhurried, dawdling, lumbering'),
      challenge: L('ponderous, lethargic, languid, laborious'),
    },
    pretty: {
      cls: 'adjective', why: 'What kind of pretty? Pick a word that paints a clearer picture.',
      lower: L('lovely, beautiful, cute, sweet'),
      ambitious: L('attractive, charming, dazzling, elegant, graceful, stunning'),
      challenge: L('exquisite, radiant, resplendent, picturesque, enchanting, captivating'),
    },
    ugly: {
      cls: 'adjective', why: 'Show the reader exactly how unpleasant it looked.',
      lower: L('horrible, hideous, nasty, scary'),
      ambitious: L('grotesque, repulsive, unsightly, gruesome'),
      challenge: L('monstrous, repugnant, misshapen, ghastly, grisly'),
    },
    old: {
      cls: 'adjective', why: 'What kind of old? Ancient, crumbling, worn out? Be precise.',
      lower: L('ancient, aged, elderly, worn'),
      ambitious: L('crumbling, battered, antique, weathered, shabby'),
      challenge: L('decrepit, dilapidated, antiquated, venerable, timeworn, archaic'),
      avoid: { next: ['friend', 'friends', 'days', 'enough'] },
    },
    tired: {
      cls: 'adjective', why: 'How tired? A stronger adjective shows the reader.',
      lower: L('sleepy, weary, worn-out, drowsy'),
      ambitious: L('exhausted, shattered, fatigued, drained'),
      challenge: L('lethargic, listless, depleted, spent'),
      avoid: { next: ['of'] },
    },
    loud: {
      cls: 'adjective', why: 'How loud? Help the reader hear it!',
      lower: L('noisy, booming, deafening, rowdy'),
      ambitious: L('thunderous, ear-splitting, raucous, blaring, roaring'),
      challenge: L('cacophonous, resounding, clamorous, strident, reverberating'),
    },
    quiet: {
      cls: 'adjective', why: 'What kind of quiet? Peaceful, eerie, silent? Be precise.',
      lower: L('silent, soft, calm, still, hushed'),
      ambitious: L('peaceful, muffled, tranquil, muted, faint'),
      challenge: L('inaudible, serene, soundless, placid'),
    },
    dark: {
      cls: 'adjective', why: 'How dark? Set the mood with a more powerful word.',
      lower: L('gloomy, shadowy, dim, murky'),
      ambitious: L('pitch-black, shady, dusky, sombre, unlit'),
      challenge: L('inky, obsidian, foreboding, sunless, impenetrable'),
    },
    wet: {
      cls: 'adjective', why: 'How wet? Help the reader feel it.',
      lower: L('soggy, soaked, damp, dripping, muddy'),
      ambitious: L('drenched, sodden, waterlogged, sopping, clammy'),
      challenge: L('saturated, bedraggled, dank, rain-lashed'),
    },
    funny: {
      cls: 'adjective', why: 'What kind of funny? Silly, clever, ridiculous?',
      lower: L('silly, hilarious, comical, daft, cheeky'),
      ambitious: L('amusing, witty, humorous, ridiculous, zany'),
      challenge: L('absurd, farcical, ludicrous, side-splitting, whimsical, droll'),
    },
    fun: {
      cls: 'adjective', why: 'What made it fun? Exciting, thrilling, entertaining?',
      lower: L('exciting, enjoyable, lively'),
      ambitious: L('thrilling, entertaining, delightful, exhilarating'),
      challenge: L('riveting, captivating, invigorating, electrifying'),
    },
    hungry: {
      cls: 'adjective', why: 'How hungry? Make the reader’s tummy rumble!',
      lower: L('starving, peckish, empty'),
      ambitious: L('famished, ravenous, greedy'),
      challenge: L('voracious, insatiable, gluttonous'),
    },
    strange: {
      cls: 'adjective', why: 'What kind of strange? Mysterious, spooky, unusual?',
      lower: L('odd, unusual, spooky, funny'),
      ambitious: L('peculiar, bizarre, curious, mysterious, eerie'),
      challenge: L('uncanny, outlandish, eccentric, surreal, enigmatic'),
    },
    scary: {
      cls: 'adjective', why: 'How scary? Build suspense with a more powerful word.',
      lower: L('spooky, frightening, creepy, terrifying'),
      ambitious: L('eerie, sinister, chilling, menacing, haunting'),
      challenge: L('ominous, harrowing, blood-curdling, spine-chilling, macabre'),
    },
    boring: {
      cls: 'adjective', why: 'Make even a boring thing sound interesting with a precise word!',
      lower: L('dull, plain, slow'),
      ambitious: L('tedious, dreary, monotonous, uneventful'),
      challenge: L('mundane, humdrum, wearisome, lacklustre, insipid'),
    },
    mean: {
      cls: 'adjective', why: 'How unkind? Show the reader exactly what the character is like.',
      lower: L('unkind, nasty, spiteful, cruel'),
      ambitious: L('heartless, vicious, selfish, bullying'),
      challenge: L('malicious, callous, vindictive, merciless'),
    },

    // --------------------------------------------------------- adverbs
    quickly: {
      cls: 'adverb', why: 'An ambitious adverb (or adverbial) shows exactly how fast.',
      lower: L('swiftly, rapidly, speedily, hurriedly'),
      ambitious: L('briskly, hastily, promptly, nimbly'),
      challenge: L('in a flash, like lightning, at breakneck speed, frantically'),
    },
    slowly: {
      cls: 'adverb', why: 'Show the reader exactly how slowly – carefully, lazily, nervously?',
      lower: L('gently, carefully, gradually, steadily'),
      ambitious: L('sluggishly, cautiously, unhurriedly, lazily'),
      challenge: L('ponderously, languidly, laboriously, at a snail’s pace'),
    },
    then: {
      cls: 'adverb', fronted: true,
      why: 'Lots of sentences start with ‘Then’. Try a fronted adverbial to show WHEN – and remember the comma!',
      lower: L('Next, After that, Later, Suddenly'),
      ambitious: L('Moments later, Without warning, Before long, Soon afterwards, All of a sudden'),
      challenge: L('In the blink of an eye, Without a moment’s hesitation, Shortly afterwards, Out of nowhere, Meanwhile'),
    },

    // ----------------------------------------------------------- nouns
    thing: {
      cls: 'noun', why: '‘Thing’ doesn’t tell the reader what it is! Name it more precisely.',
      lower: L('object, item, gadget, toy'),
      ambitious: L('contraption, device, artefact, possession'),
      challenge: L('apparatus, curiosity, trinket, implement'),
      avoid: { prev: ['some', 'any', 'every', 'no'] },
    },
    stuff: {
      cls: 'noun', why: '‘Stuff’ is a very vague word. What exactly was it?',
      lower: L('things, items, belongings, bits'),
      ambitious: L('possessions, equipment, supplies, materials'),
      challenge: L('paraphernalia, apparatus, miscellany, accessories'),
    },
    place: {
      cls: 'noun', why: 'What kind of place? Name it more precisely to set the scene.',
      lower: L('spot, area, town, land'),
      ambitious: L('location, setting, region, destination'),
      challenge: L('locality, vicinity, terrain, realm, domain'),
      avoid: { prev: ['first', 'second', 'third', 'last'], next: ['to'] },
    },
  };

  const ALIASES = {
    little: 'small', great: 'good', lovely: 'nice', weird: 'strange', quick: 'fast', ok: 'good', okay: 'good',
    frightened: 'scared', afraid: 'scared', cross: 'angry', mad: 'angry', huge: null, said: 'say', went: 'go', got: 'get',
    saw: 'see', ate: 'eat', ran: 'run', fell: 'fall', thought: 'think', made: 'make', things: 'thing', places: 'place',
  };
  const INTENSIFIERS = ['very', 'really', 'so', 'super', 'extremely', 'quite'];
  const COUNTS = { verb: 1, adjective: 1, adverb: 1, noun: 1 };

  const bare = (s) => String(s || '').toLowerCase().replace(/[’']s$/, '').replace(/[^a-z'-]/g, '');

  function entryFor(tok) {
    if (!tok || !COUNTS[tok.cls]) return null;
    const cands = [bare(tok.text), tok.root, bare(tok.normal)].filter(Boolean);
    for (const c of cands) {
      const key = Object.prototype.hasOwnProperty.call(ALIASES, c) ? ALIASES[c] : c;
      if (key && ENTRIES[key] && ENTRIES[key].cls === tok.cls) return key;
    }
    return null;
  }

  function formOf(tok) {
    const t = tok.tags;
    if (tok.cls === 'verb') {
      if (t.has('PastTense')) return 'past';
      if (t.has('Gerund')) return 'ing';
      if (t.has('PresentTense') && /s$/.test(bare(tok.text)) && !t.has('Infinitive')) return 'present3';
    }
    if (tok.cls === 'noun' && (tok.sub === 'plural' || t.has('Plural'))) return 'plural';
    if (tok.cls === 'adjective') {
      if (t.has('Comparative') || /er$/.test(bare(tok.text)) && tok.sub === 'comparative') return 'comparative';
      if (t.has('Superlative') || tok.sub === 'superlative') return 'superlative';
    }
    return null;
  }

  function sameSentence(a, b) { return a && b && a.sentence === b.sentence; }
  function sentenceStart(tokens, i) {
    const prev = tokens[i - 1];
    return !prev || prev.sentence !== tokens[i].sentence || /[.!?]["'”’]?\s*$/.test(prev.post);
  }

  function avoided(key, tokens, i) {
    const a = ENTRIES[key].avoid;
    if (!a) return false;
    const next = sameSentence(tokens[i], tokens[i + 1]) && !/[,.;:!?]/.test(tokens[i].post) ? tokens[i + 1] : null;
    const prev = sameSentence(tokens[i], tokens[i - 1]) ? tokens[i - 1] : null;
    const n = next ? bare(next.text) : '';
    if (a.next && next && a.next.includes(n)) return true;
    if (a.prev && prev && a.prev.includes(bare(prev.text))) return true;
    if (a.nextAdjective && next && next.cls === 'adjective') return true;
    if (a.nextVerb && next && next.cls === 'verb') return true;
    if (a.goingTo && n === 'to' && tokens[i + 2] && tokens[i + 2].cls === 'verb') return true;
    return false;
  }

  /**
   * Find the words to level up in an analysed text (Grammar.analyse()).
   * Returns units: [{ ids: [tokenIndex...], key, cls, form, kind: 'plain'|'very'|'fronted' }]
   */
  function findUnits(analysis) {
    const tokens = analysis.tokens;
    const units = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const w = bare(t.text);
      const next = sameSentence(t, tokens[i + 1]) ? tokens[i + 1] : null;

      // "very big" -> one powerful word
      if (INTENSIFIERS.includes(w) && t.cls === 'adverb' && next && next.cls === 'adjective' && !/[,;]/.test(t.post)) {
        const key = entryFor(next);
        if (key && ENTRIES[key].cls === 'adjective') {
          units.push({ ids: [i, i + 1], key, cls: 'adjective', form: formOf(next), kind: 'very' });
          i++;
          continue;
        }
      }
      // "Then" at the start of a sentence -> fronted adverbial
      if (w === 'then' && sentenceStart(tokens, i)) {
        units.push({ ids: [i], key: 'then', cls: 'adverb', form: null, kind: 'fronted' });
        continue;
      }
      const key = entryFor(t);
      if (key && key !== 'then' && !avoided(key, tokens, i)) {
        units.push({ ids: [i], key, cls: ENTRIES[key].cls, form: formOf(t), kind: 'plain' });
      }
    }
    return units;
  }

  // forms the grammar library gets wrong
  const FIXED = {
    murmur: { ing: 'murmuring' }, tiptoe: { past: 'tiptoed' }, gallop: { past: 'galloped', ing: 'galloping' },
    peep: { past: 'peeped' }, gawp: { past: 'gawped' }, wallop: { past: 'walloped', ing: 'walloping' },
    hoot: { past: 'hooted' }, spring: { ing: 'springing' }, slump: { past: 'slumped' },
  };
  function syllables(w) {
    const groups = (w.toLowerCase().replace(/e$/, '').match(/[aeiouy]+/g) || []).length;
    const splits = (w.toLowerCase().match(/ia|io|eo|ua|uo|iu/g) || []).length;
    return Math.max(1, groups + splits);
  }

  /** Change a suggestion to match the pupil's word: tense, plural, -er/-est, capital letter. */
  function shape(word, form, inflect, capital) {
    let out = word;
    if (form && !/\s/.test(word)) {
      if (FIXED[word] && FIXED[word][form]) {
        out = FIXED[word][form];
      } else if (form === 'comparative' || form === 'superlative') {
        // short words take -er/-est (tinier, wettest); longer ones take more/most (more enormous)
        const short = !/-/.test(word) && (syllables(word) === 1 || (syllables(word) === 2 && /y$/.test(word)));
        const done = short && inflect ? inflect(word, form) : word;
        out = done !== word ? done : (form === 'comparative' ? 'more ' : 'most ') + word;
      } else {
        out = inflect ? inflect(word, form) : word;
      }
    }
    if (capital) out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }

  /**
   * Suggestions for a unit at a level, ready to show.
   * Returns [{ tier: 'lower'|'ambitious'|'challenge', words: [...] }]
   */
  function suggestions(unit, level, inflect, capital) {
    const e = ENTRIES[unit.key];
    if (!e) return [];
    const tiers = level === 'upper' ? ['challenge', 'ambitious'] : ['lower'];
    return tiers.map((tier) => ({
      tier,
      words: Array.from(new Set(e[tier].map((w) => shape(w, unit.form, inflect, capital || e.fronted)))),
    })).filter((g) => g.words.length);
  }

  return { ENTRIES, findUnits, suggestions, shape, entryFor };
});
