/*
 * wordforms.js — changes words into their other forms using British English
 * spelling rules, so the app never invents words like "petrifiedded" or "pept".
 *
 *   verbForm('stop', 'past')      -> 'stopped'     (also 'ing' and 'present3')
 *   baseVerb('petrified')         -> 'petrify'
 *   compare('glum', 'comparative') -> 'glummer'    (null for words like 'enormous')
 *   plural('wolf')                -> 'wolves'
 *
 * Works in the browser (window.WordForms) and in Node.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WordForms = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------- irregular verbs
  // base: past (British forms)
  const IRREGULAR = {
    arise: 'arose', awake: 'awoke', be: 'was', bear: 'bore', beat: 'beat', become: 'became', begin: 'began',
    behold: 'beheld', bend: 'bent', bet: 'bet', bind: 'bound', bite: 'bit', bleed: 'bled', blow: 'blew', break: 'broke',
    breed: 'bred', bring: 'brought', build: 'built', burn: 'burnt', burst: 'burst', buy: 'bought', catch: 'caught',
    choose: 'chose', cling: 'clung', come: 'came', cost: 'cost', creep: 'crept', cut: 'cut', deal: 'dealt', dig: 'dug',
    do: 'did', draw: 'drew', dream: 'dreamt', drink: 'drank', drive: 'drove', eat: 'ate', fall: 'fell', feed: 'fed',
    feel: 'felt', fight: 'fought', find: 'found', flee: 'fled', fling: 'flung', fly: 'flew', forbid: 'forbade',
    forget: 'forgot', forgive: 'forgave', freeze: 'froze', get: 'got', give: 'gave', go: 'went', grind: 'ground',
    grow: 'grew', hang: 'hung', have: 'had', hear: 'heard', hide: 'hid', hit: 'hit', hold: 'held', hurt: 'hurt',
    keep: 'kept', kneel: 'knelt', know: 'knew', lay: 'laid', lead: 'led', leap: 'leapt', learn: 'learnt', leave: 'left',
    lend: 'lent', let: 'let', light: 'lit', lose: 'lost', make: 'made', mean: 'meant', meet: 'met', pay: 'paid',
    put: 'put', quit: 'quit', read: 'read', ride: 'rode', ring: 'rang', rise: 'rose', run: 'ran', say: 'said',
    see: 'saw', seek: 'sought', sell: 'sold', send: 'sent', set: 'set', shake: 'shook', shine: 'shone', shoot: 'shot',
    shrink: 'shrank', shut: 'shut', sing: 'sang', sink: 'sank', sit: 'sat', sleep: 'slept', slide: 'slid',
    sling: 'slung', slink: 'slunk', smell: 'smelt', speak: 'spoke', speed: 'sped', spell: 'spelt', spend: 'spent',
    spill: 'spilt', spin: 'spun', spit: 'spat', split: 'split', spread: 'spread', spring: 'sprang', stand: 'stood',
    steal: 'stole', stick: 'stuck', sting: 'stung', stink: 'stank', stride: 'strode', strike: 'struck',
    string: 'strung', strive: 'strove', swear: 'swore', sweep: 'swept', swim: 'swam', swing: 'swung', take: 'took',
    teach: 'taught', tear: 'tore', tell: 'told', think: 'thought', throw: 'threw', tread: 'trod',
    understand: 'understood', wake: 'woke', wear: 'wore', weave: 'wove', weep: 'wept', win: 'won', wind: 'wound',
    write: 'wrote',
  };
  const DUAL = new Set('burn dream learn leap smell spell spill kneel'.split(' '));
  const PREFIXES = ['over', 'under', 'with', 'mis', 'out', 'fore', 'up', 're', 'un', 'be'];
  const PAST_TO_BASE = {};
  Object.keys(IRREGULAR).forEach((b) => { if (!PAST_TO_BASE[IRREGULAR[b]]) PAST_TO_BASE[IRREGULAR[b]] = b; });
  Object.assign(PAST_TO_BASE, { was: 'be', were: 'be', is: 'be', are: 'be', am: 'be', been: 'be', has: 'have', does: 'do', goes: 'go', done: 'do', gone: 'go', seen: 'see', taken: 'take', given: 'give', written: 'write', eaten: 'eat', fallen: 'fall', spoken: 'speak', broken: 'break', chosen: 'choose', driven: 'drive', frozen: 'freeze', hidden: 'hide', ridden: 'ride', risen: 'rise', stolen: 'steal', woken: 'wake', worn: 'wear', torn: 'tear', sworn: 'swear', flown: 'fly', grown: 'grow', known: 'know', thrown: 'throw', drawn: 'draw', shown: 'show', sung: 'sing', swum: 'swim', drunk: 'drink', begun: 'begin', rung: 'ring', sunk: 'sink', shrunk: 'shrink' });

  // two-syllable verbs stressed at the end, which double their last letter (begin -> beginning)
  const DOUBLE_END = new Set(('begin forget regret refer prefer permit admit commit occur upset forbid submit omit ' +
    'compel propel rebel equip unwrap outwit kidnap transfer deter confer patrol control').split(' '));

  const VOWEL = /[aeiou]/;
  function syllables(w) {
    const s = w.toLowerCase().replace(/(?<=[^aeiouy])e$/, '').replace(/^y/, '');
    const groups = (s.match(/[aeiouy]+/g) || []).length;
    const extra = (s.match(/ia|io|eo|ua|uo|iu|ue(?=t)/g) || []).length;   // giant, piano, quiet
    return Math.max(1, groups + extra);
  }
  // one syllable, ends consonant-vowel-consonant (stop, swim, plod, quit) -> double the last letter
  function doublesLast(w) {
    if (DOUBLE_END.has(w)) return true;
    if (/[aeiou]l$/.test(w) && !/[aeiou]{2}l$/.test(w) && w.length > 3) return true;   // British: travel -> travelled
    if (syllables(w) !== 1) return false;
    const core = w.replace(/^qu/, 'q');
    return /[^aeiou][aeiou][^aeiouwxy]$/.test(core) || /^[aeiou][^aeiouwxy]$/.test(core);
  }

  function irregularPast(base) {
    if (IRREGULAR[base]) return IRREGULAR[base];
    for (const p of PREFIXES) {
      if (base.startsWith(p) && IRREGULAR[base.slice(p.length)] && base.length - p.length >= 3) return p + IRREGULAR[base.slice(p.length)];
    }
    return null;
  }

  /** Change a base verb: form = 'past' | 'ing' | 'present3' */
  function verbForm(base, form) {
    const b = String(base).toLowerCase();
    if (!/^[a-z]+$/.test(b)) return base;
    if (form === 'present3') {
      if (b === 'be') return 'is';
      if (b === 'have') return 'has';
      if (b === 'do' || b === 'go') return b + 'es';
      if (/(s|x|z|ch|sh)$/.test(b) || /[^aeiou]o$/.test(b)) return b + 'es';
      if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ies';
      return b + 's';
    }
    if (form === 'past') {
      const irr = irregularPast(b);
      if (irr) return irr;
      if (/e$/.test(b)) return b + 'd';
      if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied';
      if (/[aeiou]c$/.test(b) && syllables(b) > 1) return b + 'ked';
      if (doublesLast(b)) return b + b.slice(-1) + 'ed';
      return b + 'ed';
    }
    if (form === 'ing') {
      if (b === 'be') return 'being';
      if (/ie$/.test(b)) return b.slice(0, -2) + 'ying';
      if (/(ee|oe|ye)$/.test(b)) return b + 'ing';
      if (/[^aeiou]e$/.test(b) || /[aiu]e$/.test(b)) return b.slice(0, -1) + 'ing';
      if (/[aeiou]c$/.test(b) && syllables(b) > 1) return b + 'king';
      if (doublesLast(b)) return b + b.slice(-1) + 'ing';
      return b + 'ing';
    }
    return base;
  }

  /**
   * Find the base form of a verb: petrified -> petrify, ran -> run, gleaming -> gleam.
   * isKnown (optional): a function saying whether a word is a real English word, used to break ties.
   */
  function baseVerb(word, isKnown) {
    const w = String(word).toLowerCase();
    if (PAST_TO_BASE[w]) return PAST_TO_BASE[w];
    if (IRREGULAR[w]) return w;
    for (const p of PREFIXES) {
      if (w.startsWith(p) && PAST_TO_BASE[w.slice(p.length)]) return p + PAST_TO_BASE[w.slice(p.length)];
    }
    let form = null;
    let cands = [];
    if (/ing$/.test(w) && w.length > 4) {
      form = 'ing';
      const s = w.slice(0, -3);
      cands = [s, s + 'e', s.slice(0, -1), s.replace(/y$/, 'ie'), s.replace(/ck$/, 'c')];
    } else if (/ed$/.test(w) && w.length > 3) {
      form = 'past';
      const s = w.slice(0, -2);
      cands = [s, w.slice(0, -1), s.slice(0, -1), s.replace(/i$/, 'y'), s.replace(/ck$/, 'c')];
    } else if (/s$/.test(w) && !/ss$/.test(w) && w.length > 3) {
      form = 'present3';
      cands = [w.slice(0, -1), w.slice(0, -2), w.replace(/ies$/, 'y')];
    } else {
      return w;
    }
    // spelling rules: ignore stems that can't be English verbs (petrifi, stopp, stoppe, panick)
    const plausible = (c) => c.length >= 3 && !(/i$/.test(c) && c !== 'ski') && !/([^aeiouslfz])\1$/.test(c) &&
      !/([^aeiou])\1e$/.test(c) && !/cke$/.test(c) && !(c.length > 3 && /[^aeiou]ie$/.test(c)) &&
      !(/ck$/.test(c) && verbForm(c.slice(0, -1), form) === w);
    // verbs with two British past forms (spilt/spilled, burnt/burned) accept either
    const makes = (c) => verbForm(c, form) === w || (form === 'past' && DUAL.has(c) && c + 'ed' === w);
    let fits = Array.from(new Set(cands)).filter(makes);
    fits = fits.filter(plausible);
    // British "travelled": prefer travel over travell
    fits = fits.filter((c) => !(/[aeiou]ll$/.test(c) && syllables(c) > 1 && fits.includes(c.slice(0, -1))));
    if (!fits.length) return w;
    // hiss/his, spill/spil, buzz/buz: base verbs ending in s, l, f or z usually double it
    fits = fits.filter((c) => !(fits.includes(c + c.slice(-1)) && /[slfz]$/.test(c)));
    if (fits.length === 1) return fits[0];
    const known = typeof isKnown === 'function' ? fits.filter((c) => safe(() => isKnown(c))) : [];
    if (known.length === 1) return known[0];
    // "making"/"mak", "galloped"/"gallope": decide whether the base word ends in "e"
    const withE = fits.find((c) => /e$/.test(c) && fits.includes(c.slice(0, -1)));
    if (withE) {
      const noE = withE.slice(0, -1);
      if (syllables(noE) === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(noE)) return withE;   // make, hope, stare
      if (/(c|v|z|dg|u|s|o|[bcdfgkptz]l)$/.test(noE)) return withE;                        // dance, love, raise, shuffle, tiptoe
      if (syllables(noE) > 1) return noE;                                                    // gallop, murmur, whisper
      return noE;                                                                            // gleam, peer, play
    }
    return fits[0];
  }

  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  // ---------------------------------------------------------- adjectives
  const IRREG_ADJ = {
    good: ['better', 'best'], bad: ['worse', 'worst'], far: ['further', 'furthest'], well: ['better', 'best'],
    cruel: ['crueller', 'cruellest'], quiet: ['quieter', 'quietest'], shy: ['shyer', 'shyest'], sly: ['slyer', 'slyest'],
  };
  // words that already mean "extremely", so "more enormous" / "most furious" don't work
  const EXTREME = new Set(('huge giant enormous massive gigantic immense vast colossal mammoth monumental gargantuan ' +
    'titanic mountainous towering microscopic minuscule infinitesimal miniature freezing boiling scorching sweltering ' +
    'blistering baking roasting burning arctic polar glacial ancient terrified petrified horrified aghast panic-stricken ' +
    'ecstatic overjoyed jubilant euphoric heartbroken devastated furious livid fuming enraged incensed irate seething ' +
    'starving famished deafening ear-splitting thunderous silent soundless inaudible pitch-black inky obsidian exhausted ' +
    'shattered spent depleted soaked drenched sodden saturated waterlogged hilarious side-splitting brilliant fantastic ' +
    'excellent superb outstanding terrific marvellous wonderful exceptional impeccable exemplary sublime first-rate ' +
    'perfect super awful terrible dreadful atrocious abysmal abominable appalling dire deplorable monstrous supersonic ' +
    'meteoric breakneck headlong whirlwind archaic decrepit dilapidated antiquated timeworn ghastly grisly gruesome ' +
    'macabre blood-curdling spine-chilling harrowing riveting electrifying exhilarating thrilling captivating ' +
    'voracious insatiable ravenous unique dead empty full').split(/\s+/));

  /** form = 'comparative' | 'superlative'. Returns null for words that can't be compared. */
  function compare(adj, form) {
    const a = String(adj).toLowerCase();
    const i = form === 'superlative' ? 1 : 0;
    if (IRREG_ADJ[a]) return IRREG_ADJ[a][i];
    if (EXTREME.has(a)) return null;
    const more = (form === 'superlative' ? 'most ' : 'more ') + a;
    const er = form === 'superlative' ? 'est' : 'er';
    if (/-/.test(a) || /(ed|ing|ful|less|ous|ive|ic|al|ish|ant|ent|re|able|ible)$/.test(a) || /^(worn|torn|spent|lost|real|right|wrong|fun|own|just)$/.test(a)) return more;
    const syl = syllables(a);
    if (syl === 1) {
      if (/e$/.test(a)) return a + er.slice(1);
      if (/[^aeiou]y$/.test(a)) return a.slice(0, -1) + 'i' + er;
      if (/[^aeiou][aeiou][^aeiouwxy]$/.test(a)) return a + a.slice(-1) + er;
      return a + er;
    }
    if (syl === 2) {
      if (/[^aeiou]y$/.test(a)) return a.slice(0, -1) + 'i' + er;
      if (/(le|ow|er)$/.test(a)) return /e$/.test(a) ? a + er.slice(1) : a + er;
    }
    return more;
  }

  // ---------------------------------------------------------- nouns
  const IRREG_NOUN = {
    man: 'men', woman: 'women', child: 'children', person: 'people', mouse: 'mice', tooth: 'teeth', foot: 'feet',
    goose: 'geese', sheep: 'sheep', deer: 'deer', fish: 'fish', ox: 'oxen', cactus: 'cacti', knife: 'knives',
    wife: 'wives', life: 'lives', wolf: 'wolves', leaf: 'leaves', loaf: 'loaves', half: 'halves', thief: 'thieves',
    shelf: 'shelves', elf: 'elves', calf: 'calves', hero: 'heroes', potato: 'potatoes', tomato: 'tomatoes',
    echo: 'echoes', volcano: 'volcanoes',
  };
  // nouns with no plural form
  const UNCOUNTABLE = new Set(('equipment paraphernalia stuff furniture information luggage baggage homework advice ' +
    'music news rubbish money bread butter rice sand water weather knowledge courage evidence traffic').split(' '));
  function plural(noun) {
    const n = String(noun).toLowerCase();
    if (IRREG_NOUN[n]) return IRREG_NOUN[n];
    if (UNCOUNTABLE.has(n)) return n;
    if (/(people|children|men|mice|teeth|feet|geese)$/.test(n)) return n;
    if (/[^s]s$/.test(n) && !/(us|is)$/.test(n)) return n;               // already plural
    if (/(s|x|z|ch|sh)$/.test(n)) return n + 'es';
    if (/[^aeiou]y$/.test(n)) return n.slice(0, -1) + 'ies';
    return n + 's';
  }

  /**
   * One place for every word change. form: past | ing | present3 | plural | comparative | superlative.
   * Returns the changed word, or null if the word can't be changed that way (e.g. "more enormous").
   */
  function inflect(word, form) {
    if (!form) return word;
    const w = String(word);
    if (/\s/.test(w)) return form === 'comparative' || form === 'superlative' ? null : w;
    const keepCase = (out) => (out && /^[A-Z]/.test(w) ? out.charAt(0).toUpperCase() + out.slice(1) : out);
    if (form === 'past' || form === 'ing' || form === 'present3') {
      // suggestions are base words; never add an ending twice (no "petrifiedded")
      if ((form === 'past' && /ed$/i.test(w)) || (form === 'ing' && /ing$/i.test(w))) return w;
      return keepCase(verbForm(w, form));
    }
    if (form === 'plural') return keepCase(plural(w));
    if (form === 'comparative' || form === 'superlative') return keepCase(compare(w, form));
    return w;
  }

  return { inflect, verbForm, baseVerb, compare, plural, syllables, IRREGULAR, EXTREME };
});
