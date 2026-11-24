/*
 * peat.js — Alan Peat sentence types, as used in the school's sentence-type
 * cards. Each type has: a formula (with coloured parts), an explanation,
 * examples ([[double brackets]] mark the key parts) and a success-criteria
 * checklist. Most checks are automatic; ones marked `self` are for pupils
 * to check themselves.
 * Works in the browser (window.Peat) and in Node for testing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Peat = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SETS = {
    red: { label: 'Red set', colour: '#C92A2A', soft: '#FFF5F5' },
    lightblue: { label: 'Light blue set', colour: '#0B7285', soft: '#E3FAFC' },
    blue: { label: 'Blue set', colour: '#1864AB', soft: '#E7F5FF' },
    green: { label: 'Green set', colour: '#237032', soft: '#EBFBEE' },
  };

  const EMOTIONS = new Set(('desperate terrified anxious nervous furious delighted excited exhausted frightened worried angry ' +
    'happy sad lonely curious confused determined relieved ecstatic petrified jealous ashamed embarrassed proud hopeful ' +
    'heartbroken bored calm brave startled shocked amazed astonished horrified disappointed miserable grateful scared ' +
    'afraid fearful frustrated overjoyed thrilled upset cross livid enraged puzzled bewildered stunned weary tired ' +
    'hungry cold anxious tense panicked uneasy content cheerful joyful gleeful elated glum gloomy sorrowful tearful ' +
    'helpless hopeless fearless shy timid bold eager impatient restless confident').split(/\s+/));
  const WEATHER = /\b(rain|raindrops?|wind|winds|breeze|gale|sun|sunshine|snow|snowflakes?|fog|mist|thunder|lightning|storm|clouds?|frost|hail|sleet|drizzle|weather|blizzard|hurricane|tornado|sky|ice)\b/i;
  const HUMAN_VERBS = ('weep wept cry cried scream sob whisper howl dance smile grin laugh moan groan sigh creep crept ' +
    'rage grumble sing sang wail tiptoe kiss hug shout yell sleep slept attack punch slap claw march stomp glare frown ' +
    'tickle stroke caress bite bit snarl growl mutter mumble complain argue sulk tease chase hurry hurried wander ' +
    'embrace greet wave beckon whistle hum snore sneeze shiver tremble stare peer weep weeps wink blink yawn').split(/\s+/);

  // helpers used by the checks
  const words = (t) => (String(t).match(/[A-Za-z’'-]+/g) || []);
  const firstWord = (t) => (words(t)[0] || '').toLowerCase();
  const sentences = (t) => String(t).split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const verbRe = new RegExp(`\\b(${HUMAN_VERBS.map((v) => v + '(?:s|es|ed|d|ing)?').join('|')})\\b`, 'i');

  // generic checks added to every type
  const CAPITAL = { text: 'Starts with a capital letter', test: (t) => /^["'“‘(]*[A-Z]/.test(t.trim()) };
  const END = { text: 'Ends with a full stop, question mark or exclamation mark', test: (t) => /[.!?]["'”’)]*$/.test(t.trim()) };

  const TYPES = [
    // ------------------------------------------------------------------ red
    {
      id: '2a', name: '2A sentences', set: 'red',
      formula: '<b>adjective</b>, <b>adjective</b> noun',
      what: 'A 2A sentence has <strong>two adjectives before a noun</strong>, with a comma between them. You can have two pairs in the same sentence!',
      parts: ['adjective', 'comma', 'adjective', 'noun'],
      examples: [
        'The [[glamorous, intelligent]] princess kissed the [[grotesque, warty]] frog.',
        'A [[huge, hairy]] spider scuttled across the [[cold, dusty]] floor.',
        'The [[brave, loyal]] knight rode towards the [[dark, crumbling]] castle.',
      ],
      tip: 'Choose adjectives that tell the reader different things, e.g. one about size and one about colour or personality.',
      checks: [
        { text: 'Two adjectives before a noun, with a comma between them', test: (t, G) => {
          if (!G) return /\b\w+,\s*\w+\s+\w+/.test(t);
          const ts = G.analyse(t).tokens;
          return ts.some((x, i) => x.cls === 'adjective' && /,/.test(x.post) && ts[i + 1] && ts[i + 1].cls === 'adjective' && ts[i + 2] && ['noun', 'propernoun'].includes(ts[i + 2].cls));
        } },
      ],
    },
    {
      id: 'simile', name: '…as a / …like a', set: 'red',
      formula: '… <b>as</b> ___ <b>as a</b> … / … <b>like a</b> …',
      what: 'Similes contain <strong>“…as a…”</strong> or <strong>“…like a…”</strong>. They compare one thing to another.',
      parts: ['thing being described', 'as … as a / like a', 'what it is compared to'],
      examples: [
        'The flames were [[as fierce as a]] tiger hunting for its prey.',
        'The exploding bomb was [[like a]] bubbling volcano.',
        'The old man’s skin was [[as wrinkled as a]] crumpled paper bag.',
        'The fog rolled in [[like a]] thick grey blanket.',
      ],
      tip: 'Make your comparison surprising. “As white as snow” is used a lot, so try something fresh!',
      checks: [
        { text: 'Uses “as … as a/an” or “like a/an”', test: (t) => /\bas\b\s+\w+(\s+\w+)?\s+as\s+(a|an|the)\b|\blike\s+(a|an|the)\b/i.test(t) },
      ],
    },
    {
      id: 'boys', name: ', BOYS sentences', set: 'red',
      formula: 'first part<b>, but / or / yet / so</b> second part',
      what: 'BOYS sentences have two parts joined by a comma and one of the conjunctions <strong>b</strong>ut, <strong>o</strong>r, <strong>y</strong>et or <strong>s</strong>o.',
      parts: ['first part', 'comma', 'but / or / yet / so', 'second part'],
      examples: [
        'The princess was intelligent[[, but]] she was ugly.',
        'The princess could kiss the frog[[, or]] she could leave him for others.',
        'The frog was grotesque[[, yet]] he was rich.',
        'The princess kissed the frog[[, so]] he turned into a prince.',
      ],
      tip: '“Yet” is great for a surprise or a contrast. “So” shows what happened as a result.',
      checks: [
        { text: 'Uses but, or, yet or so to join two parts', test: (t) => /\b(but|or|yet|so)\b\s+\w+/i.test(t) },
        { text: 'A comma before but / or / yet / so', test: (t) => /,\s*(but|or|yet|so)\b/i.test(t) },
      ],
    },
    // ------------------------------------------------------------ light blue
    {
      id: '3ed', name: '3 ___ed, sentences', set: 'lightblue',
      formula: '<b>___ed, ___ed, ___ed,</b> rest of sentence',
      what: '3 ___ed sentences <strong>begin with three related adjectives, each ending in “ed”</strong>, with a comma after each one.',
      parts: ['-ed adjective', 'comma', '-ed adjective', 'comma', '-ed adjective', 'comma', 'rest of the sentence'],
      examples: [
        '[[Frightened, terrified, exhausted,]] the princess ran for home.',
        '[[Bored, annoyed, frustrated,]] Sam stared at the clock.',
        '[[Amazed, delighted, thrilled,]] the children opened the treasure chest.',
      ],
      tip: 'Make the three words build up, getting stronger each time: worried → scared → terrified.',
      checks: [
        { text: 'Starts with three words ending in -ed', test: (t) => /^\W*\w+ed\W+\w+ed\W+\w+ed\b/i.test(t) },
        { text: 'A comma after each of the three words', test: (t) => /^\W*\w+ed,\s*\w+ed,\s*\w+ed,\s*\w/i.test(t) },
      ],
    },
    {
      id: 'doublely', name: 'Double ly ending sentences', set: 'lightblue',
      formula: 'verb … <b>___ly and ___ly</b>.',
      what: 'Double ly sentences <strong>end with two adverbs (ending in -ly) after a verb</strong>, joined by “and”. You can also start with them, followed by a comma.',
      parts: ['verb', 'adverb (-ly)', 'and', 'adverb (-ly)'],
      examples: [
        'He swam [[slowly and cautiously]].',
        'She searched [[frantically and determinedly]].',
        '[[Joyfully and purposefully]], they hurried along.',
        'The dragon breathed [[heavily and angrily]].',
      ],
      tip: 'Pick two adverbs that work together to show exactly HOW the action happened.',
      checks: [
        { text: 'Two -ly adverbs joined by “and”', test: (t) => /\b\w+ly\s+and\s+\w+ly\b/i.test(t) },
        { text: 'They come at the end (or at the start, followed by a comma)', test: (t) => /\w+ly\s+and\s+\w+ly\s*[.!?]["'”’]*\s*$/i.test(t.trim()) || /^\W*\w+ly\s+and\s+\w+ly,/i.test(t) },
      ],
    },
    // ------------------------------------------------------------------ blue
    {
      id: 'inged', name: '___ing, ___ed sentences', set: 'blue',
      formula: '<b>___ing</b> where, <b>___ed</b> what happened.',
      what: 'An ing, ed sentence <strong>begins with a verb ending in “ing”</strong>, then says <strong>where</strong> the action happened, then a comma, then <strong>an “ed” verb</strong> telling us what happened next.',
      parts: ['-ing verb', 'location of the action', 'comma', '-ed verb', 'what happened'],
      examples: [
        '[[Driving]] to town, he [[stopped]] to watch the UFO land.',
        '[[Running]] near the beach, he [[halted]] as the ground gave way.',
        '[[Climbing]] up the tower, she [[gasped]] at the view.',
      ],
      tip: 'The -ing part sets the scene; the -ed part is the surprise or the incident.',
      checks: [
        { text: 'Starts with a verb ending in -ing', test: (t) => /^\W*\w+ing\b/i.test(t) },
        { text: 'A comma after where the action happened', test: (t) => /^\W*\w+ing\b[^,]*\w[^,]*,/i.test(t) },
        { text: 'An -ed verb after the comma', test: (t) => /,\s*(\w+\s+){0,3}\w+ed\b/i.test(t) },
      ],
    },
    {
      id: 'verbperson', name: 'Verb, person sentences', set: 'blue',
      formula: '<b>Verb,</b> person + rest of the sentence.',
      what: 'These sentences <strong>start with a verb, followed by a comma</strong>, then the <strong>name of a person</strong> (or he / she / they) and the rest of the sentence.',
      parts: ['verb', 'comma', 'person', 'rest of the sentence'],
      examples: [
        '[[Flying,]] John had always been terrified of it.',
        '[[Trembling,]] he fled from the beast.',
        '[[Gasping,]] Maya reached the top of the hill.',
      ],
      tip: 'Choose a verb that instantly shows what the character is doing or feeling.',
      checks: [
        { text: 'Starts with a verb followed straight away by a comma', test: (t) => /^\W*\w+(ing|ed),/i.test(t) },
        { text: 'Then a person (a name, or he / she / they / I / we)', test: (t) => /^\W*\w+,\s*(he|she|they|I|we|[A-Z][a-z]+)\b/.test(t) },
      ],
    },
    {
      id: 'emotion', name: 'Emotion word, (comma) sentences', set: 'blue',
      formula: '<b>Emotion word,</b> rest of the sentence.',
      what: 'Emotion word sentences <strong>begin with a feeling word (an adjective), followed by a comma</strong>.',
      parts: ['emotion word (adjective)', 'comma', 'rest of the sentence'],
      examples: [
        '[[Desperate,]] she screamed for help.',
        '[[Terrified,]] she froze on the spot where she stood.',
        '[[Delighted,]] Tom punched the air.',
      ],
      tip: 'Show the feeling through the action in the rest of the sentence, e.g. Furious, he slammed the door.',
      checks: [
        { text: 'Starts with ONE word followed by a comma', test: (t) => /^\W*[A-Za-z]+,\s*\w/.test(t) },
        { text: 'The first word is an emotion (feeling) word', test: (t, G) => {
          const w = firstWord(t);
          if (EMOTIONS.has(w)) return true;
          if (!G) return false;
          const tok = G.analyse(t).tokens[0];
          return !!tok && tok.cls === 'adjective';
        } },
      ],
    },
    {
      id: 'which', name: 'Noun, which / where / who', set: 'blue',
      formula: '<b>Noun,</b> which / where / who + extra information, rest of the sentence.',
      what: 'These sentences begin with a <strong>noun, then a comma, followed by which, where or who</strong> and some extra “tucked in” information, then another comma and the rest of the sentence.',
      parts: ['noun', 'comma', 'which / where / who', 'tucked-in information', 'comma', 'rest of the sentence'],
      examples: [
        'Cakes[[, which]] taste fantastic[[,]] are not so good for your health.',
        'Mr Tims[[, who]] is my favourite teacher[[,]] is leaving the school soon.',
        'The old mill[[, where]] we used to play[[,]] was knocked down last year.',
      ],
      tip: 'Use “who” for people, “which” for things and “where” for places.',
      checks: [
        { text: 'A comma, then which / where / who', test: (t) => /,\s*(which|where|who)\b/i.test(t) },
        { text: 'Another comma after the extra information', test: (t) => /,\s*(which|where|who)\b[^,]+,\s*\w/i.test(t) },
        { text: 'The sentence starts with the noun', test: (t) => { const m = /^([^,]+),\s*(which|where|who)\b/i.exec(t.trim()); return !!m && words(m[1]).length <= 4; } },
      ],
    },
    {
      id: 'themore', name: 'The more, the more', set: 'blue',
      formula: '<b>The more</b> emotion …, <b>the more</b> related action …',
      what: 'The more, the more sentences are in <strong>two parts</strong>. The first “more” is followed by an emotion word; the second “more” is followed by a related action or emotion.',
      parts: ['The more', 'emotion', 'comma', 'the more', 'action related to the emotion'],
      examples: [
        '[[The more]] upset she was[[, the more]] her tears flowed.',
        '[[The more]] confident she became[[, the more]] talkative she seemed to be.',
        '[[The more]] nervous he felt[[, the more]] his hands shook.',
      ],
      tip: 'The second part should be a result of the first, getting bigger as the feeling grows.',
      checks: [
        { text: 'Starts with “The more”', test: (t) => /^\W*the more\b/i.test(t) },
        { text: 'A comma, then “the more” again', test: (t) => /,\s*the more\b/i.test(t) },
      ],
    },
    {
      id: 'adsame', name: 'Ad, same ad', set: 'blue',
      formula: '… <b>adjective</b> noun, <b>same adjective</b> because …',
      what: 'This sentence has <strong>two identical adjectives</strong>, one repeated shortly after the other, after a comma, and usually followed by <strong>because</strong>.',
      parts: ['adjective', 'noun', 'comma', 'adjective repeated', 'because …'],
      examples: [
        'He was a [[fast]] runner, [[fast]] because he needed to be.',
        'It was a [[silent]] town, [[silent]] because all the residents had fled.',
        'It was a [[dangerous]] journey, [[dangerous]] because of the wolves in the forest.',
      ],
      tip: 'Repeating the adjective makes the reader pay attention to it, and “because” explains why.',
      checks: [
        { text: 'A word is repeated straight after a comma', test: (t) => /\b([A-Za-z]+)\b[^,]*,\s*\1\b/i.test(t) },
        { text: 'The repeated word is followed by “because”', test: (t) => /\b([A-Za-z]+)\b[^,]*,\s*\1\s+because\b/i.test(t) },
      ],
    },
    {
      id: 'yoked', name: 'Last word, first word (yoked)', set: 'blue',
      formula: 'Sentence ending in <b>word</b>. <b>Word</b> + more detail.',
      what: 'This is made up of <strong>two sentences</strong>. The second sentence <strong>begins with the word or phrase the first sentence ends with</strong>. (Almost the same as an Ad, same ad.)',
      parts: ['first sentence', 'last word', 'full stop', 'same word', 'more detail'],
      examples: [
        'Building the new motorway would be [[disastrous]]. [[Disastrous]] because lots of houses would need to be destroyed.',
        'In the corner of the attic stood a [[box]]. A [[box]] that no one had opened for a hundred years.',
        'Everyone in the village feared the [[forest]]. The [[forest]] was where the wolves lived.',
      ],
      tip: 'This links your sentences tightly together and puts the spotlight on the repeated word.',
      checks: [
        { text: 'Two sentences', test: (t) => sentences(t).length >= 2 },
        { text: 'The second sentence starts with the last word of the first', test: (t) => {
          const s = sentences(t);
          if (s.length < 2) return false;
          const last = words(s[0]).pop();
          const second = words(s[1]).slice(0, 3).map((w) => w.toLowerCase());
          return !!last && second.includes(last.toLowerCase());
        } },
      ],
    },
    // ----------------------------------------------------------------- green
    {
      id: 'dede', name: 'De: De sentences', set: 'green',
      formula: '<b>Description</b> : <b>details</b>.',
      what: 'A De: De (Description: Details) sentence has <strong>two parts separated by a colon</strong>. The first part gives a description; the second gives further details.',
      parts: ['description', 'colon (:)', 'details'],
      examples: [
        'The vampire is a dreadful creature[[:]] it kills by sucking all the blood from its victims.',
        'Snails are slow[[:]] they take hours to move the shortest of distances.',
        'The castle was impossible to attack[[:]] it stood on a cliff surrounded by the sea.',
      ],
      tip: 'The part after the colon should explain or prove the first part.',
      checks: [
        { text: 'Two parts separated by a colon', test: (t) => /\w[^:]*:\s*\w/.test(t) },
        { text: 'The second part gives more details about the first', self: true },
      ],
    },
    {
      id: 'weather', name: 'Personification of weather', set: 'green',
      formula: 'The <b>weather</b> + <b>human action</b> …',
      what: 'In this sentence, <strong>the weather is given a human trait</strong>. It helps to create a particular mood in a story.',
      parts: ['weather', 'human action or feeling', 'the mood it creates'],
      examples: [
        { t: 'The rain [[wept]] down the window.', note: 'sad mood' },
        { t: 'The wind [[screamed]] through the branches.', note: 'tense, scary mood' },
        { t: 'The sun [[smiled]] warmly on the village.', note: 'happy mood' },
        { t: 'Thunder [[grumbled]] in the distance.', note: 'worried, uneasy mood' },
      ],
      tip: 'Choose the human action to match the mood you want, e.g. sad → wept, angry → raged.',
      checks: [
        { text: 'Mentions the weather (rain, wind, sun, snow, fog, thunder…)', test: (t) => WEATHER.test(t) },
        { text: 'The weather does something a person does (wept, screamed, danced…)', test: (t) => verbRe.test(t) },
      ],
    },
    {
      id: 'oi', name: 'O. (I.) sentences', set: 'green',
      formula: '<b>Outside</b> actions. <b>(Inside</b> true feelings.<b>)</b>',
      what: 'O. (I.) sentences are made up of <strong>two related sentences</strong>. The first tells the reader the character’s <strong>outward actions</strong>. The second, <strong>in brackets</strong>, shows their true <strong>inner feelings</strong>.',
      parts: ['outside: what the character does', 'brackets', 'inside: what they really feel'],
      examples: [
        'He smiled and shook the man’s hand warmly. [[(Inside, however, he was more angry than he had ever been.)]]',
        'She laughed along with everyone else. [[(Inside, she felt completely alone.)]]',
        'Tom waved goodbye cheerfully. [[(Inside, his heart was breaking.)]]',
      ],
      tip: 'The two parts should contrast: the outside hides what is really going on inside.',
      checks: [
        { text: 'A first sentence about what the character does', test: (t) => /\w[^()]*[.!?]\s*\(/.test(t) },
        { text: 'A second sentence in brackets', test: (t) => /\([^)]*\w[^)]*\)/.test(t) },
        { text: 'The brackets show what they really feel inside', self: true },
      ],
    },
    {
      id: '3bad', name: '3 bad – (dash) question?', set: 'green',
      formula: '<b>bad, bad, bad</b> – question?',
      what: 'These sentences begin with <strong>three negative words</strong>. After the third there is a <strong>dash</strong> and then <strong>a question</strong> relating to them.',
      parts: ['3 negative words', 'dash', 'question about them'],
      examples: [
        '[[Greed, jealousy, hatred –]] which of these was John’s worst trait?',
        '[[Thirst, heatstroke, exhaustion –]] which would kill him first?',
        '[[Darkness, silence, loneliness –]] which did she fear the most?',
      ],
      tip: 'This is perfect for building tension, or for persuasive and discussion writing.',
      checks: [
        { text: 'Starts with three words separated by commas', test: (t) => /^\W*\w+,\s*\w+,\s*\w+/i.test(t) },
        { text: 'A dash after the third word', test: (t) => /^\W*\w+,\s*\w+,\s*\w+\s*[–—-]/i.test(t) },
        { text: 'Ends with a question mark', test: (t) => /\?["'”’]*\s*$/.test(t.trim()) },
      ],
    },
    {
      id: 'ififif', name: 'If, if, if, then', set: 'green',
      formula: '<b>If</b> …, <b>if</b> …, <b>if</b> …, <b>then</b> …',
      what: 'If, if, if, then sentences are made up of <strong>three “if” parts</strong> followed by <strong>“then”</strong> and the result.',
      parts: ['if …', 'if …', 'if …', 'then …'],
      examples: [
        '[[If]] the alarm had gone off, [[if]] the bus had been on time, [[if]] the road repairs had been completed, [[then]] his life would not have been destroyed.',
        '[[If]] I hadn’t found that watch, [[if]] the alarm hadn’t gone off, [[if]] it hadn’t scared those burglars, [[then]] I wouldn’t be sitting here today.',
        '[[If]] the gate had been locked, [[if]] the dog had stayed asleep, [[if]] nobody had shouted, [[then]] the chickens would still be safe.',
      ],
      tip: 'Great for showing how small things can lead to a big result, especially at the start of a story.',
      checks: [
        { text: 'Uses “if” three times', test: (t) => (t.match(/\bif\b/gi) || []).length >= 3 },
        { text: 'Commas between the “if” parts', test: (t) => /\bif\b[^,]+,\s*if\b[^,]+,\s*if\b/i.test(t) },
        { text: 'Then “then” and the result', test: (t) => /,\s*then\b\s+\w/i.test(t) },
      ],
    },
    {
      id: '2pairs', name: '2 pairs sentences', set: 'green',
      formula: '<b>___ and ___, ___ and ___,</b> rest of the sentence.',
      what: '2 pairs sentences <strong>begin with two pairs of related adjectives</strong>, each joined by “and”, with a comma after each pair. Then explain what they relate to.',
      parts: ['adjective and adjective', 'comma', 'adjective and adjective', 'comma', 'explanation'],
      examples: [
        '[[Exhausted and worried, cold and hungry,]] they did not know how much further they had to go.',
        '[[Excited and nervous, proud and happy,]] she walked onto the stage.',
        '[[Dark and damp, cold and silent,]] the cave seemed to go on forever.',
      ],
      tip: 'Each pair should go together, e.g. two feelings, or two things you can feel.',
      checks: [
        { text: 'Starts with a pair of words joined by “and”, then a comma', test: (t) => /^\W*\w+\s+and\s+\w+,/i.test(t) },
        { text: 'A second pair joined by “and”, then a comma', test: (t) => /^\W*\w+\s+and\s+\w+,\s*\w+\s+and\s+\w+,\s*\w/i.test(t) },
      ],
    },
    {
      id: 'someothers', name: 'Some; others sentences', set: 'green',
      formula: '<b>Some</b> …<b>; others</b> …',
      what: 'Some; others sentences <strong>begin with the word “some”</strong> and have a <strong>semicolon (;) instead of “but”</strong> to separate the two parts.',
      parts: ['Some …', 'semicolon (;)', 'others …'],
      examples: [
        '[[Some]] people love football[[; others]] just can’t stand it.',
        '[[Some]] evacuees had an awful time in World War Two[[; other]] evacuees enjoyed it.',
        '[[Some]] dragons guard treasure[[; others]] prefer to sleep all day.',
      ],
      tip: 'Use it to show two sides of something, which is great for non-fiction and discussion writing.',
      checks: [
        { text: 'Starts with “Some”', test: (t) => /^\W*some\b/i.test(t) },
        { text: 'A semicolon (;) separates the two parts', test: (t) => /\w\s*;\s*\w/.test(t) },
        { text: '“other” or “others” after the semicolon', test: (t) => /;\s*(\w+\s+)?others?\b/i.test(t) },
      ],
    },
    {
      id: 'imagine', name: 'Imagine 3 examples:', set: 'green',
      formula: '<b>Imagine</b> … when/where …, when/where …, when/where …<b>:</b> statement.',
      what: 'These sentences begin with <strong>“Imagine”</strong> and describe <strong>three things</strong> about a place, time or person. After the third there is a <strong>colon</strong>, followed by a statement saying there is such a time, place or person.',
      parts: ['Imagine', '3 descriptions', 'colon (:)', 'statement'],
      examples: [
        '[[Imagine]] a time [[when]] people were not afraid, [[when]] life was much simpler, [[when]] everyone helped each other[[:]] this is the story of that time.',
        '[[Imagine]] a place [[where]] the sun always shines, [[where]] wars never happen, [[where]] no one ever dies[[:]] in the Andromeda 5 system there is such a planet.',
        '[[Imagine]] a person [[who]] never gives up, [[who]] always tells the truth, [[who]] helps everyone they meet[[:]] that person was my grandmother.',
      ],
      tip: 'A brilliant way to open a story, or the start of a persuasive piece.',
      checks: [
        { text: 'Starts with “Imagine”', test: (t) => /^\W*imagine\b/i.test(t) },
        { text: 'Three descriptions (when / where / who used three times)', test: (t) => ['when', 'where', 'who'].some((w) => (t.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length >= 3) },
        { text: 'A colon (:) before the final statement', test: (t) => /\w\s*:\s*\w/.test(t) },
      ],
    },
    {
      id: 'pc', name: 'P.C. sentences (paired conjunctions)', set: 'green',
      formula: '<b>both</b> … <b>and</b> / <b>neither</b> … <b>nor</b> / <b>not so</b> … <b>as</b> / <b>as</b> … <b>as</b>',
      what: 'P.C. is short for <strong>paired conjunctions</strong>: two joining words that work together. Both / and, neither / nor, not so / as, as / as.',
      parts: ['first conjunction', '…', 'its partner'],
      examples: [
        'It was [[both]] cold [[and]] unpleasant for him to work there.',
        '[[Neither]] money [[nor]] gifts could make him visit the haunted mansion.',
        'The second test was [[not so]] difficult [[as]] the first.',
        'The giant was [[as]] tall [[as]] a lighthouse.',
      ],
      tip: 'Remember the pairs: both / and, neither / nor, not so / as, as / as.',
      checks: [
        { text: 'Uses a pair: both…and, neither…nor, not so…as or as…as', test: (t) => /\bboth\b.+\band\b|\bneither\b.+\bnor\b|\bnot so\b.+\bas\b|\bas\b\s+\w+(\s+\w+)?\s+as\b|\beither\b.+\bor\b/i.test(t) },
      ],
    },
    {
      id: 'definition', name: 'One word / phrase: definition', set: 'green',
      formula: '<b>Word or phrase:</b> definition.',
      what: 'These sentences begin with <strong>one word or phrase followed by a colon</strong>. This is then followed by a <strong>definition</strong> of the word.',
      parts: ['one word or phrase', 'colon (:)', 'definition'],
      examples: [
        '[[Monday:]] the longest day of the week!',
        '[[World War Two:]] a time when many people lost their lives.',
        '[[Homework:]] the reason weekends are never long enough.',
      ],
      tip: 'The definition can be serious (for non-fiction) or funny (for a story or diary).',
      checks: [
        { text: 'Starts with a word or short phrase, then a colon', test: (t) => { const m = /^([^:]+):\s*\S/.exec(t.trim()); return !!m && words(m[1]).length <= 4; } },
        { text: 'A definition after the colon', test: (t) => /:\s*(\S+\s+){2,}\S/.test(t) },
      ],
    },
  ];

  /** Check a pupil's sentence. Returns [{ text, ok (true/false/null for self-check) }] */
  function check(type, text, G) {
    const t = String(text || '');
    const list = type.checks.concat(type.id === '3bad' ? [CAPITAL] : [CAPITAL, END]);
    return list.map((c) => ({ text: c.text, ok: c.self ? null : (t.trim() ? !!safe(() => c.test(t.trim(), G)) : false) }));
  }
  function safe(fn) { try { return fn(); } catch (e) { return false; } }

  function parts(t) {
    return String(t).split(/(\[\[.*?\]\])/).filter(Boolean).map((p) => (p.startsWith('[[') ? { text: p.slice(2, -2), mark: true } : { text: p, mark: false }));
  }
  function plain(t) { return String(t && t.t != null ? t.t : t).replace(/\[\[|\]\]/g, ''); }
  // examples can be plain strings or { t, note }
  const example = (e) => (typeof e === 'string' ? { t: e } : e);

  return { SETS, TYPES, check, parts, plain, example };
});
