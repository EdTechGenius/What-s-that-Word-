/*
 * grammar.js — works out the word class of every word in a text and
 * explains, in child-friendly language, WHY each word belongs to that class.
 *
 * Uses the compromise NLP library (vendor/compromise.js) for the first
 * tagging pass, then applies primary-school (KS2) grammar conventions on top,
 * e.g. "their helmets" -> "their" is a determiner, numbers before nouns are
 * determiners, "up" in "lining up" is an adverb.
 *
 * Works in the browser (window.Grammar) and in Node (module.exports) so it
 * can be tested without a browser.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../vendor/compromise.js'), require('./wordforms.js'));
  } else {
    root.Grammar = factory(root.nlp, root.WordForms);
  }
})(typeof self !== 'undefined' ? self : this, function (nlp, WF) {
  'use strict';

  // Describing words that the tagger's dictionary is missing or gets wrong
  try {
    const extra = {};
    ('stormy snowy leafy shadowy crumbly rugged minuscule terrified blustery deserted desolate stony bony scaly ' +
     'feathery thundery drizzly breezy gusty soggy slushy dewy moonlit starlit sunlit cobwebbed').split(' ').forEach((w) => { extra[w] = 'Adjective'; });
    nlp.addWords(extra);
  } catch (e) { /* older compromise */ }

  // ---------------------------------------------------------------- classes
  const CLASSES = {
    noun: {
      label: 'Noun', short: 'N', emoji: '📦',
      kid: 'It names a person, a place, a thing or an idea.',
    },
    propernoun: {
      label: 'Proper noun', short: 'PN', emoji: '🏷️',
      kid: 'It is the special name of one particular person, place or thing, so it starts with a capital letter.',
    },
    verb: {
      label: 'Verb', short: 'V', emoji: '🏃',
      kid: 'It is a doing, being or having word. It tells us what is happening.',
    },
    adjective: {
      label: 'Adjective', short: 'Adj', emoji: '🎨',
      kid: 'It describes a noun. It tells us more about a person, place or thing.',
    },
    adverb: {
      label: 'Adverb', short: 'Adv', emoji: '⏱️',
      kid: 'It tells us more about a verb, an adjective or another adverb – often how, when, where or how often something happens.',
    },
    pronoun: {
      label: 'Pronoun', short: 'Pro', emoji: '👤',
      kid: 'It takes the place of a noun, so we don’t have to keep repeating the noun.',
    },
    determiner: {
      label: 'Determiner', short: 'Det', emoji: '👉',
      kid: 'It comes before a noun and tells us which one, whose, or how many.',
    },
    preposition: {
      label: 'Preposition', short: 'Prep', emoji: '📍',
      kid: 'It links a noun or pronoun to the rest of the sentence – often showing where or when.',
    },
    conjunction: {
      label: 'Conjunction', short: 'Conj', emoji: '🔗',
      kid: 'It is a joining word. It joins words, phrases or clauses together.',
    },
    interjection: {
      label: 'Interjection', short: 'Int', emoji: '❗',
      kid: 'It shows a sudden feeling or reaction, like surprise, pain or delight.',
    },
    other: {
      label: 'Not sure', short: '?', emoji: '🤔',
      kid: 'We are not sure about this one. Talk to your teacher about it!',
    },
  };
  const ORDER = ['noun', 'propernoun', 'verb', 'adjective', 'adverb', 'pronoun',
    'determiner', 'preposition', 'conjunction', 'interjection'];

  // ------------------------------------------------------------- word lists
  const set = (s) => new Set(s.split(/\s+/).filter(Boolean));
  const ARTICLES = set('a an the');
  const DEMONSTRATIVES = set('this that these those');
  const QUANTIFIERS = set('some any many much few several every each all both either neither no enough more most less fewer another other');
  const POSSESSIVE_DET = set('my your his her its our their whose');
  const SUBJECT_PRON = set('i you he she it we they');
  const OBJECT_PRON = set('me him her us them');
  const POSSESSIVE_PRON = set('mine yours hers ours theirs');
  const REFLEXIVE_PRON = set('myself yourself himself herself itself ourselves yourselves themselves');
  const INDEFINITE_PRON = set('someone somebody something anyone anybody anything everyone everybody everything noone nobody nothing none one');
  const RELATIVE_PRON = set('who whom whose which that');
  const COORDINATING = set('for and nor but or yet so');
  const SUBORDINATING = set('because although though while whilst when whenever where wherever if unless until till since as after before once whereas whether');
  const PREP_OR_CONJ = set('before after since until till as');
  const INTERJECTIONS = set('oh ooh wow ouch hey hello hi bye goodbye yes no yay hooray hurray oops uh um er ah aha alas phew yikes eek gosh wow ugh hmm shh boo');
  const ADVERB_WORDS = set('here there outside inside now then today tonight yesterday tomorrow soon later always never often sometimes usually rarely seldom everywhere somewhere anywhere nowhere away upstairs downstairs abroad indoors outdoors afterwards meanwhile finally suddenly however therefore already still yet again once twice not too very quite rather almost nearly');
  const PARTICLES = set('up down in out off on away back over around about along through');
  const TIME_ADV = set('now then today tonight yesterday tomorrow soon later already still yet afterwards meanwhile finally recently early late lately once');
  const PLACE_ADV = set('here there outside inside everywhere somewhere anywhere nowhere away upstairs downstairs abroad indoors outdoors up down in out off on back over around along through nearby');
  const FREQ_ADV = set('always never often sometimes usually rarely seldom frequently occasionally again twice daily weekly');
  const DEGREE_ADV = set('very too quite rather so really extremely incredibly almost nearly totally completely fairly slightly more most less least');
  const PLACE_PREP = set('in on under over above below behind beside between among near inside outside into onto through across along around beneath opposite past towards toward at by up down against within');
  const TIME_PREP = set('before after during until till since by at on in throughout');

  // ---------------------------------------------------------------- helpers
  const has = (tok, tag) => tok && tok.tags.has(tag);
  const lower = (s) => (s || '').toLowerCase();
  // the "word" part of a token, without possessive 's or curly quotes
  const bare = (s) => lower(s).replace(/[’']s$/, '').replace(/[’']/g, "'");

  function rawNounish(tok) {
    if (!tok) return false;
    if (has(tok, 'Pronoun')) return false;
    return has(tok, 'Noun') || has(tok, 'Adjective') || has(tok, 'Value') || has(tok, 'ProperNoun');
  }
  function endsClause(tok) {
    // true if the token is followed by punctuation that ends a phrase
    return tok && /[,.;:!?—–)]/.test(tok.post);
  }

  // ------------------------------------------------------- tokenising text
  /**
   * Split text into paragraphs -> tokens. Each token keeps its exact
   * surrounding text (pre/post) so the original text can be rebuilt exactly.
   */
  function tokenise(paragraphText) {
    const doc = nlp(paragraphText);
    try { doc.compute('root'); } catch (e) { /* older builds */ }
    const json = doc.json({ offset: false });
    const tokens = [];
    json.forEach((sentence, si) => {
      const terms = sentence.terms;
      for (let k = 0; k < terms.length; k++) {
        const t = terms[k];
        const tok = {
          text: t.text, pre: t.pre || '', post: t.post || '',
          normal: t.normal || lower(t.text), root: t.root || null,
          tags: new Set(t.tags), sentence: si,
          parts: [{ text: t.text, implicit: t.implicit, tags: t.tags }],
        };
        const prev = tokens[tokens.length - 1];
        // contraction halves come through with empty text ("don't" -> do + not)
        if (t.text === '' && prev) {
          prev.post += t.pre + t.post;
          prev.parts.push(tok.parts[0]);
          prev.contraction = true;
          continue;
        }
        // hyphenated words ("well-made") become one word
        if (prev && prev.joinNext) {
          prev.text += tok.pre + tok.text;
          prev.post = tok.post;
          prev.normal = lower(prev.text);
          prev.tags = tok.tags;           // word class of the last part
          prev.root = null;
          prev.parts.push(tok.parts[0]);
          prev.hyphenated = true;
          prev.joinNext = /^-$/.test(tok.post) && k < terms.length - 1;
          continue;
        }
        tok.joinNext = /^-$/.test(tok.post) && k < terms.length - 1;
        if (tok.joinNext) { tok.post = ''; tok.text += '-'; }
        tokens.push(tok);
      }
    });
    tokens.forEach((t) => {
      if (t.joinNext === false || t.joinNext === true) delete t.joinNext;
      t.text = t.text.replace(/-{2,}/g, '-');
    });
    return tokens;
  }

  // -------------------------------------------------- classify one token
  function classify(tokens, i) {
    const t = tokens[i];
    const w = bare(t.normal || t.text);
    const prev = tokens[i - 1] && tokens[i - 1].sentence === t.sentence ? tokens[i - 1] : null;
    const next = tokens[i + 1] && tokens[i + 1].sentence === t.sentence ? tokens[i + 1] : null;
    const nextNounish = rawNounish(next) && !endsClause(t);
    const r = (cls, sub) => ({ cls, sub: sub || null });

    if (!/[a-z0-9]/i.test(t.text)) return r('other');

    // interjections
    if (has(t, 'Expression') || (INTERJECTIONS.has(w) && (endsClause(t) || !next) && !nextNounish)) {
      return r('interjection');
    }

    // possessives like my / their / her
    if (POSSESSIVE_DET.has(w)) {
      if (w === 'whose' && !nextNounish) return r('pronoun', 'relative');
      if ((w === 'her' || w === 'his' || w === 'its') && !nextNounish) {
        return r('pronoun', w === 'her' ? 'object' : 'possessive');
      }
      return r('determiner', 'possessive');
    }

    // demonstratives: "this book" (determiner) vs "I like this" (pronoun)
    if (DEMONSTRATIVES.has(w) && (has(t, 'Determiner') || has(t, 'Pronoun'))) {
      return nextNounish ? r('determiner', 'demonstrative') : r('pronoun', 'demonstrative');
    }
    if (w === 'that' && (has(t, 'Conjunction') || has(t, 'Preposition'))) return r('conjunction', 'subordinating');

    // question / relative words
    if (has(t, 'QuestionWord') || ['who', 'whom', 'which', 'what', 'when', 'where', 'why', 'how'].includes(w)) {
      if ((w === 'which' || w === 'what') && nextNounish) return r('determiner', 'question');
      if (w === 'who' || w === 'whom' || w === 'which' || w === 'what') {
        return r('pronoun', i === 0 || (prev && /[.!?]\s*$/.test(prev.post)) ? 'question' : 'relative');
      }
      if ((w === 'when' || w === 'where') && prev) return r('conjunction', 'subordinating');
      return r('adverb', 'question');
    }

    // pronouns
    if (has(t, 'Pronoun') || SUBJECT_PRON.has(w) || OBJECT_PRON.has(w) || POSSESSIVE_PRON.has(w) ||
        REFLEXIVE_PRON.has(w) || (INDEFINITE_PRON.has(w) && w !== 'one')) {
      if (REFLEXIVE_PRON.has(w)) return r('pronoun', 'reflexive');
      if (POSSESSIVE_PRON.has(w)) return r('pronoun', 'possessive');
      if (INDEFINITE_PRON.has(w)) return r('pronoun', 'indefinite');
      if (OBJECT_PRON.has(w)) return r('pronoun', 'object');
      return r('pronoun', 'personal');
    }

    // numbers: "eighty men" -> determiner, "I counted eighty" -> noun
    if (has(t, 'Value') || /^\d/.test(w)) {
      if (has(t, 'Ordinal')) return r('adjective', 'ordinal');
      return nextNounish ? r('determiner', 'number') : r('noun', 'number');
    }

    // determiners
    if (has(t, 'Determiner') || ARTICLES.has(w)) {
      if (ARTICLES.has(w)) return r('determiner', 'article');
      if (QUANTIFIERS.has(w) && !nextNounish && w !== 'every' && w !== 'no') return r('pronoun', 'indefinite');
      return r('determiner', QUANTIFIERS.has(w) ? 'quantifier' : null);
    }

    // words that are prepositions or conjunctions: "before the sun" vs "before he woke"
    if (PREP_OR_CONJ.has(w) && next) {
      const n = bare(next.normal);
      if (SUBJECT_PRON.has(n) || (has(next, 'ProperNoun') && tokens[i + 2] && has(tokens[i + 2], 'Verb'))) {
        return r('conjunction', 'subordinating');
      }
    }

    // "to" before a verb is part of the infinitive ("to watch")
    if (w === 'to') {
      return next && has(next, 'Verb') && !has(next, 'Gerund') && !has(next, 'Noun') ? r('preposition', 'infinitive') : r('preposition');
    }

    // conjunctions
    if (has(t, 'Conjunction') || COORDINATING.has(w) && w !== 'for' && w !== 'so' && w !== 'yet') {
      return r('conjunction', COORDINATING.has(w) ? 'coordinating' : 'subordinating');
    }
    if (w === 'so' && prev && /,\s*$/.test(prev.post)) return r('conjunction', 'coordinating');
    if (SUBORDINATING.has(w) && !has(t, 'Preposition') && !has(t, 'Adverb')) return r('conjunction', 'subordinating');

    // particles in phrasal verbs: "lining up", "looked up"
    if (has(t, 'Particle')) return r('adverb', 'place');

    // prepositions (but "Outside," on its own is an adverb)
    if (has(t, 'Preposition')) {
      if ((ADVERB_WORDS.has(w) || PARTICLES.has(w)) && (!next || endsClause(t))) return r('adverb', advType(w));
      if (PARTICLES.has(w) && next && (has(next, 'Verb') || has(next, 'Adverb'))) return r('adverb', 'place');
      return r('preposition', PLACE_PREP.has(w) ? 'place' : TIME_PREP.has(w) ? 'time' : null);
    }

    // "not", "never"
    if (has(t, 'Negative') || w === 'not' || w === "n't") return r('adverb', 'negative');

    // common adverbs that the tagger sometimes calls nouns/adjectives ("Outside, ...", "Here")
    if (ADVERB_WORDS.has(w) && !nextNounish && !(prev && (has(prev, 'Determiner') || has(prev, 'Preposition')))) {
      if (!(has(t, 'Noun') && next && has(next, 'Verb') && i === 0 && ['today', 'tomorrow', 'yesterday', 'tonight'].includes(w))) {
        return r('adverb', advType(w));
      }
    }

    // "-ed" feeling words after a being verb: "He was petrified of spiders", "She felt exhausted."
    if (has(t, 'PastTense') && /ed$/.test(w) && prev && /^(am|is|are|was|were|be|been|being|feel|feels|felt|seem|seems|seemed|look|looks|looked|became|become|becomes|appeared|grew)$/.test(bare(prev.normal)) &&
        (!next || endsClause(t) || /^(of|about|with|at|and|but|that|when|because)$/.test(bare(next.normal)))) {
      return r('adjective');
    }

    // verbs
    if (has(t, 'Verb') || has(t, 'Copula') || has(t, 'Modal') || has(t, 'Auxiliary')) {
      if (has(t, 'Modal')) return r('verb', 'modal');
      if (has(t, 'Auxiliary') && next && (has(next, 'Verb') || has(next, 'Adverb') || has(next, 'Negative'))) {
        return r('verb', 'auxiliary');
      }
      if (has(t, 'Copula')) return r('verb', 'being');
      if (has(t, 'Imperative')) return r('verb', 'command');
      if (has(t, 'PastTense')) return r('verb', 'past');
      if (has(t, 'Gerund')) return r('verb', 'ing');
      if (has(t, 'Infinitive')) return r('verb', 'base');
      return r('verb', has(t, 'PresentTense') ? 'present' : null);
    }

    if (has(t, 'Adverb')) return r('adverb', advType(w));

    if (has(t, 'Adjective')) {
      if (has(t, 'Comparative')) return r('adjective', 'comparative');
      if (has(t, 'Superlative')) return r('adjective', 'superlative');
      return r('adjective');
    }

    if (has(t, 'ProperNoun') || has(t, 'Person') || has(t, 'Place') || has(t, 'Organization')) {
      // a capital letter at the start of a sentence doesn't make a proper noun
      if (/^[A-Z]/.test(t.text) || !(has(t, 'Noun'))) return r('propernoun');
    }

    if (has(t, 'Noun')) {
      // "stormy evening": a describing word the tagger mistook for a noun
      if (!has(t, 'Possessive') && next && has(next, 'Noun') && !has(next, 'Pronoun') && !endsClause(t) && isAdjectiveWord(w)) {
        return r('adjective');
      }
      if (has(t, 'Possessive')) return r('noun', 'possessive');
      if (has(t, 'Plural')) return r('noun', 'plural');
      return r('noun', has(t, 'Uncountable') ? 'uncountable' : null);
    }

    // capitalised word in the middle of a sentence that the tagger didn't know
    if (/^[A-Z]/.test(t.text) && prev) return r('propernoun');

    return r('other');
  }

  function isAdjectiveWord(w) {
    try {
      const d = nlp(w);
      return d.has('#Adjective') && !d.has('#Noun');
    } catch (e) { return false; }
  }

  function advType(w) {
    if (/ly$/.test(w) && !FREQ_ADV.has(w)) return 'manner';
    if (FREQ_ADV.has(w)) return 'frequency';
    if (TIME_ADV.has(w)) return 'time';
    if (PLACE_ADV.has(w)) return 'place';
    if (DEGREE_ADV.has(w)) return 'degree';
    return null;
  }

  // ------------------------------------------------------------- analyse
  /** Analyse a whole text. Returns { paragraphs: [ { tokens: [...] } ] } */
  function analyse(text) {
    const paragraphs = String(text || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n/)
      .map((p) => p);
    const result = { paragraphs: [] };
    let id = 0;
    let sentenceOffset = 0;
    paragraphs.forEach((p) => {
      if (!p.trim()) { result.paragraphs.push({ tokens: [], blank: true }); return; }
      const tokens = tokenise(p);
      let maxS = 0;
      tokens.forEach((t, i) => {
        const c = classify(tokens, i);
        t.cls = c.cls; t.sub = c.sub; t.id = id++;
        maxS = Math.max(maxS, t.sentence);
      });
      tokens.forEach((t, i) => {
        const n = tokens[i + 1];
        if (t.cls === 'verb' && t.sub === 'auxiliary' && has(t, 'Copula') && n && n.sentence === t.sentence && n.cls === 'adjective') t.sub = 'being';
      });
      tokens.forEach((t) => { t.sentence += sentenceOffset; });
      sentenceOffset += maxS + 1;
      result.paragraphs.push({ tokens });
    });
    // collapse runs of blank paragraphs
    result.paragraphs = result.paragraphs.filter((p, i, arr) => !(p.blank && (i === 0 || arr[i - 1].blank)));
    result.tokens = result.paragraphs.flatMap((p) => p.tokens);
    return result;
  }

  // ------------------------------------------------------- explanations
  const q = (s) => `‘${s}’`;
  const clean = (t) => t.text.replace(/-$/, '');

  function sentenceTokens(all, tok) {
    return all.filter((t) => t.sentence === tok.sentence);
  }
  function sentenceText(all, tok) {
    const ts = sentenceTokens(all, tok);
    return ts.map((t, i) => (i === 0 ? '' : t.pre) + t.text + (i === ts.length - 1 ? t.post.replace(/\s+$/, '') : t.post)).join('').trim();
  }
  function findNext(ts, i, pred, max) {
    for (let k = i + 1; k < ts.length && k <= i + (max || 99); k++) {
      if (pred(ts[k])) return ts[k];
      if (/[.;:!?]/.test(ts[k].post)) break;
    }
    return null;
  }
  function findPrev(ts, i, pred, max) {
    for (let k = i - 1; k >= 0 && k >= i - (max || 99); k--) {
      if (pred(ts[k])) return ts[k];
    }
    return null;
  }
  const isNoun = (t) => t.cls === 'noun' || t.cls === 'propernoun';
  const isSubject = (t) => isNoun(t) || (t.cls === 'pronoun' && t.sub !== 'object');

  /**
   * Explain a token (from analyse()). Returns
   * { word, cls, label, subLabel, meaning, reasons[], note, sentence, lookup, inflection }
   */
  function explain(analysis, tok) {
    const all = analysis.tokens;
    const ts = sentenceTokens(all, tok);
    const i = ts.indexOf(tok);
    const word = clean(tok);
    const w = bare(tok.normal || word);
    const info = CLASSES[tok.cls] || CLASSES.other;
    const reasons = [];
    let subLabel = null;
    let note = null;
    const next = ts[i + 1];
    const prev = ts[i - 1];

    const nounAfter = findNext(ts, i, isNoun, 4);

    switch (tok.cls) {
      case 'noun': {
        if (has(tok, 'Actor') || has(tok, 'Person')) reasons.push(`It names a person (or people): ${q(word)}.`);
        else reasons.push(`It names a person, place, thing or idea: ${q(word)}.`);
        const det = findPrev(ts, i, (t) => t.cls === 'determiner' && t.sub !== 'number', 3);
        const adj = prev && prev.cls === 'adjective' ? prev : null;
        if (det && (det === prev || (adj && ts.indexOf(det) === i - 2))) {
          reasons.push(`It comes after the determiner ${q(clean(det))}. Determiners are little signposts that point to a noun.`);
        }
        if (adj) reasons.push(`The adjective ${q(clean(adj))} is describing it – adjectives describe nouns.`);
        if (tok.sub === 'plural') {
          const single = tok.root && tok.root !== w ? tok.root : null;
          if (/s$/.test(w)) reasons.push(`It is plural (more than one). The ${q('-s')} ending is a clue.${single ? ` One of them would be a ${q(single)}.` : ''}`);
          else reasons.push(`It is an irregular plural – it means more than one${single ? ` ${q(single)}` : ''}.`);
          subLabel = 'plural noun';
        }
        if (tok.sub === 'possessive') {
          reasons.push(`The apostrophe + ${q('s')} shows that something belongs to it.`);
          subLabel = 'possessive noun';
        }
        if (tok.sub === 'number') {
          reasons.push('Here the number is used on its own, as the name of an amount.');
          subLabel = 'number';
        }
        if (/ing$/.test(w) && looksLikeVerb(w.replace(/ing$/, ''))) {
          reasons.push(`It ends in ${q('-ing')} like a verb, but here it is the name of an activity, so it is working as a noun.`);
        }
        if (prev && prev.cls === 'preposition') {
          reasons.push(`It comes after the preposition ${q(clean(prev))}.`);
        }
        if (!tok.sub || tok.sub === 'plural') {
          reasons.push(`Test it: can you put ${q('the')} in front of it? ${q('the ' + w)} – yes, so it is a noun.`);
        }
        break;
      }
      case 'propernoun': {
        const kind = has(tok, 'Person') || has(tok, 'FirstName') ? 'a person'
          : has(tok, 'Place') || has(tok, 'Country') || has(tok, 'City') ? 'a place'
          : has(tok, 'Organization') ? 'an organisation' : has(tok, 'Date') || has(tok, 'Month') || has(tok, 'WeekDay') ? 'a day or month' : 'something particular';
        reasons.push(`It is the name of ${kind}.`);
        reasons.push(i === 0
          ? 'It starts with a capital letter – and names always do, wherever they are in the sentence.'
          : 'It starts with a capital letter even though it is not at the start of the sentence. That is a big clue!');
        break;
      }
      case 'verb': {
        let subj = subjectOf(ts, i);
        if (tok.sub === 'ing' && !findPrev(ts, i, (t) => t.cls === 'verb', 3)) subj = null;
        const mainVerb = findNext(ts, i, (t) => t.cls === 'verb' && t.sub !== 'auxiliary' && t.sub !== 'modal', 4);
        if (tok.sub === 'modal') {
          subLabel = 'modal verb';
          reasons.push('It is a modal verb. Modal verbs show how likely, possible or necessary something is (can, could, will, would, should, might, must…).');
          if (mainVerb) reasons.push(`It works with the main verb ${q(clean(mainVerb))}.`);
        } else if (tok.sub === 'auxiliary') {
          subLabel = 'helping (auxiliary) verb';
          reasons.push(`It is a helping verb${mainVerb ? ` for the main verb ${q(clean(mainVerb))}` : ''}. Helping verbs (like be, have and do) work with another verb to show tense.`);
        } else if (tok.sub === 'being') {
          subLabel = 'being verb';
          reasons.push(`It is a form of the verb ${q('to be')} (am, is, are, was, were). It is a ${q('being')} verb rather than a doing verb.`);
          reasons.push(`It links ${subj ? q(clean(subj)) : 'the subject'} to more information about ${subj && subj.cls === 'pronoun' ? 'them' : 'it'}.`);
        } else {
          reasons.push(subj
            ? `It tells us what ${q(clean(subj))} ${doingPhrase(ts, i, subj)}.`
            : 'It tells us what someone or something is doing, being or having.');
        }
        if (tok.sub === 'past') {
          subLabel = 'past tense verb';
          const base = tok.root && tok.root !== w ? tok.root : null;
          reasons.push(/ed$/.test(w)
            ? `It is in the past tense – the ${q('-ed')} ending shows it has already happened.`
            : `It is in the past tense – it has already happened.${base ? ` It is the past tense of ${q(base)}.` : ''}`);
        }
        if (tok.sub === 'present') subLabel = 'present tense verb';
        if (tok.sub === 'ing') {
          const aux = findPrev(ts, i, (t) => t.cls === 'verb' && (t.sub === 'auxiliary' || t.sub === 'being'), 2);
          subLabel = '-ing verb';
          reasons.push(aux
            ? `It ends in ${q('-ing')} and works with ${q(clean(aux))} to show an action that ${/was|were/.test(bare(aux.normal)) ? 'was' : 'is'} still going on (the progressive form).`
            : `It ends in ${q('-ing')}, showing an action that is going on.`);
        }
        if (tok.sub === 'command') {
          subLabel = 'command (imperative) verb';
          reasons.push('It is giving an order or instruction – it is a bossy (imperative) verb.');
        }
        if (prev && bare(prev.normal) === 'to' && (!tok.sub || tok.sub === 'base')) {
          reasons.push(`With ${q('to')} in front it makes the infinitive ${q('to ' + w)}.`);
        }
        if (['past', 'present', null, 'base'].includes(tok.sub) && !has(tok, 'Copula')) {
          reasons.push(`Test it: try changing the tense – ${q(tenseSwap(w, tok))}. If the word changes with time, it is a verb.`);
        }
        break;
      }
      case 'adjective': {
        const copula = prev && prev.cls === 'verb' && (prev.sub === 'being' || /^(seem|seemed|seems|look|looked|looks|feel|felt|feels|became|become|becomes|sound|sounded|grew|turned)$/.test(bare(prev.normal)));
        const described = describedNoun(ts, i);
        const joined = prev && prev.cls === 'conjunction' && ts[i - 2] && ts[i - 2].cls === 'adjective' ? ts[i - 2] : null;
        if (joined) {
          reasons.push(`It is joined to the adjective ${q(clean(joined))} by ${q(clean(prev))}, so it describes the same thing.`);
        } else if (copula) {
          const subj = subjectOf(ts, i - 1);
          reasons.push(`It comes after the verb ${q(clean(prev))} and describes ${subj ? q(clean(subj)) : 'the subject'}.`);
        } else if (described && described.cls !== 'pronoun') {
          reasons.push(`It describes the noun ${q(clean(described))}. It answers the question: what kind of ${clean(described).replace(/s$/, '')}?`);
        } else {
          reasons.push('It is a describing word – it tells us what something is like.');
        }
        if (tok.sub === 'comparative') {
          subLabel = 'comparative adjective';
          reasons.push(`It compares two things – the ${/er$/.test(w) ? q('-er') + ' ending' : 'word'} shows it is comparing.`);
        }
        if (tok.sub === 'superlative') {
          subLabel = 'superlative adjective';
          reasons.push(`It shows the most or the least – the ${/est$/.test(w) ? q('-est') + ' ending' : 'word'} shows it is the top of the scale.`);
        }
        if (tok.sub === 'ordinal') {
          subLabel = 'ordinal number';
          reasons.push('It tells us the order or position of something (first, second, third…).');
        }
        if (!tok.sub && !copula && !joined && described && described.cls !== 'pronoun') {
          reasons.push(`Test it: ${q('very ' + w)} – can you put ${q('very')} in front? Most adjectives let you.`);
        }
        break;
      }
      case 'adverb': {
        const verb = findPrev(ts, i, (t) => t.cls === 'verb' && t.sub !== 'auxiliary' && t.sub !== 'modal', 4) ||
          findNext(ts, i, (t) => t.cls === 'verb' && t.sub !== 'auxiliary' && t.sub !== 'modal', 4);
        const typeText = {
          manner: 'how', time: 'when', place: 'where', frequency: 'how often', degree: 'how much', negative: 'that something is not happening', question: 'a question about how, why, when or where',
        }[tok.sub];
        if (tok.sub === 'degree' && next && (next.cls === 'adjective' || next.cls === 'adverb')) {
          reasons.push(`It makes the ${next.cls} ${q(clean(next))} stronger or weaker – it tells us how much.`);
        } else if (tok.sub === 'negative') {
          reasons.push('It turns the meaning into the opposite – it says something is NOT so.');
        } else {
          reasons.push(`It tells us more about ${verb ? `the verb ${q(clean(verb))}` : 'the action'}${typeText ? ` – it tells us ${typeText}` : ''}.`);
        }
        if (tok.sub) subLabel = tok.sub === 'negative' ? 'adverb' : `adverb of ${tok.sub === 'frequency' ? 'frequency' : tok.sub === 'manner' ? 'manner (how)' : tok.sub === 'degree' ? 'degree' : tok.sub === 'question' ? 'question' : tok.sub}`;
        if (tok.sub === 'question') subLabel = 'question adverb';
        if (/ly$/.test(w)) reasons.push(`It ends in ${q('-ly')}, which lots of adverbs do.`);
        if (i === 0 && /,/.test(tok.post)) reasons.push('It is at the front of the sentence followed by a comma – that makes it a fronted adverbial.');
        if (has(tok, 'Particle') || (prev && prev.cls === 'verb' && PARTICLES.has(w))) {
          reasons.push(`It goes with the verb ${q(clean(prev || tok))} to make a phrase: ${q(clean(prev) + ' ' + w)}.`);
        }
        break;
      }
      case 'pronoun': {
        const s = tok.sub;
        if (s === 'relative') {
          subLabel = 'relative pronoun';
          const ref = findPrev(ts, i, isNoun, 4);
          reasons.push(`It starts a relative clause – extra information about ${ref ? q(clean(ref)) : 'a noun before it'}.`);
        } else if (s === 'question') {
          subLabel = 'question pronoun';
          reasons.push('It asks a question about a person or thing we don’t know yet.');
        } else if (s === 'possessive') {
          subLabel = 'possessive pronoun';
          reasons.push('It shows who something belongs to, and it stands on its own without a noun after it.');
        } else if (s === 'reflexive') {
          subLabel = 'reflexive pronoun';
          reasons.push(`It ends in ${q('-self')} or ${q('-selves')} and points back to someone already in the sentence.`);
        } else if (s === 'indefinite') {
          subLabel = 'indefinite pronoun';
          reasons.push('It stands in for people or things without saying exactly who or what.');
        } else if (s === 'demonstrative') {
          subLabel = 'demonstrative pronoun';
          reasons.push('It points to something, and there is no noun straight after it – so it is standing in for the noun.');
        } else if (s === 'object') {
          subLabel = 'personal pronoun (object)';
          reasons.push('It stands in for a person or thing. Here it is receiving the action (the object).');
        } else {
          subLabel = 'personal pronoun';
          reasons.push(`It stands in for a person or thing${next && next.cls === 'verb' ? ` and is the one doing the verb ${q(clean(next))}` : ''}.`);
        }
        reasons.push('Pronouns save us from repeating the same noun over and over.');
        break;
      }
      case 'determiner': {
        const n = nounAfter;
        const s = tok.sub;
        if (s === 'article') {
          subLabel = w === 'the' ? 'definite article' : 'indefinite article';
          reasons.push(w === 'the'
            ? `${q('the')} is the definite article – it points to ${n && n.sub === 'plural' ? 'particular' : 'one particular'} ${n ? q(clean(n)) : 'thing'}.`
            : `${q(w)} is an indefinite article – it means any one ${n ? q(clean(n)) : 'thing'}, not a particular one.${w === 'an' ? ' We use ‘an’ before a vowel sound.' : ''}`);
        } else if (s === 'possessive') {
          subLabel = 'possessive determiner';
          reasons.push(`It tells us whose ${n ? q(clean(n)) : 'thing'} we are talking about.`);
          if (['his', 'her', 'its'].includes(w)) reasons.push(`Careful! ${q(w)} can be a pronoun too, but here it comes right before a noun, so it is a determiner.`);
        } else if (s === 'number') {
          subLabel = 'number (determiner)';
          reasons.push(`It tells us how many ${n ? q(clean(n)) : 'things'} there are. Numbers before a noun are determiners.`);
        } else if (s === 'demonstrative') {
          subLabel = 'demonstrative determiner';
          reasons.push(`It points out which ${n ? q(clean(n)) : 'thing'} – this/that one, these/those ones.`);
        } else if (s === 'quantifier') {
          subLabel = 'quantifier';
          reasons.push(`It tells us how many or how much${n ? ` – which ${q(clean(n))}` : ''}.`);
        } else if (s === 'question') {
          subLabel = 'question determiner';
          reasons.push(`It asks which ${n ? q(clean(n)) : 'thing'}.`);
        }
        if (n) reasons.push(`It comes before the noun ${q(clean(n))} – determiners always come before a noun${findNext(ts, i, (t) => t.cls === 'adjective', 1) ? ' (and before any adjectives)' : ''}.`);
        break;
      }
      case 'preposition': {
        const phrase = [];
        for (let k = i + 1; k < ts.length && k <= i + 5; k++) {
          phrase.push(clean(ts[k]));
          if (isNoun(ts[k]) || ts[k].cls === 'pronoun' || /[,.;:!?]/.test(ts[k].post)) break;
        }
        if (tok.sub === 'infinitive') {
          reasons.push(`Here ${q('to')} is working with the verb ${q(clean(next))} to make ${q('to ' + clean(next))} – the infinitive (the basic form of a verb).`);
          reasons.push(`Strictly speaking, this ${q('to')} is not linking a noun like a normal preposition, but we colour it with the prepositions. When ${q('to')} comes before a noun (${q('to the park')}), it is a true preposition.`);
          subLabel = 'infinitive ‘to’';
          break;
        }
        const kind = tok.sub === 'place' ? 'where' : tok.sub === 'time' ? 'when' : null;
        reasons.push(`It links ${phrase.length ? q(phrase.join(' ')) : 'a noun'} to the rest of the sentence${kind ? ` – it tells us ${kind}` : ''}.`);
        if (phrase.length) reasons.push(`Together they make a prepositional phrase: ${q(w + ' ' + phrase.join(' '))}.`);
        if (tok.sub === 'place') reasons.push(`Test it: think of a box – in, on, under, behind… Words that tell you the position of something are often prepositions.`);
        if (tok.sub) subLabel = `preposition of ${tok.sub}`;
        break;
      }
      case 'conjunction': {
        if (tok.sub === 'coordinating') {
          subLabel = 'coordinating conjunction';
          const same = prev && next && prev.cls === next.cls && !/[,;]/.test(prev.post);
          reasons.push(same
            ? `It joins ${q(clean(prev))} and ${q(clean(next))} – two ${CLASSES[prev.cls].label.toLowerCase()}s that are equally important.`
            : 'It joins two parts of the sentence that are equally important.');
          reasons.push('Remember FANBOYS: for, and, nor, but, or, yet, so.');
        } else {
          subLabel = 'subordinating conjunction';
          reasons.push('It starts a subordinate clause – extra information that would not make sense as a sentence on its own.');
          if (['because', 'as', 'since'].includes(w)) reasons.push('Here it gives a reason or shows time.');
          else if (['when', 'while', 'whilst', 'before', 'after', 'until', 'till', 'once', 'whenever'].includes(w)) reasons.push('It tells us when something happens.');
          else if (['if', 'unless'].includes(w)) reasons.push('It sets up a condition – something that has to happen first.');
          else if (['although', 'though', 'whereas'].includes(w)) reasons.push('It shows a contrast – something surprising or different.');
          if (PREP_OR_CONJ.has(w)) reasons.push(`Careful! ${q(w)} can be a preposition too, but here it is followed by a whole clause with its own verb.`);
        }
        break;
      }
      case 'interjection':
        reasons.push('It shows a feeling or a reaction, and it makes sense on its own.');
        if (/!/.test(tok.post)) reasons.push('It is followed by an exclamation mark – a big clue!');
        break;
      default:
        reasons.push('This one is tricky to sort! It might be a number, a symbol or a word used in an unusual way.');
    }

    if (tok.contraction) {
      const expanded = tok.parts.map((p) => p.implicit || p.text).join(' ').toLowerCase();
      note = `${q(word)} is a contraction – a short way of writing ${q(expanded)}. The apostrophe shows where letters are missing. We have coloured it by its first word.`;
    } else if (tok.hyphenated) {
      note = `${q(word)} is a hyphenated (compound) word – two words joined with a hyphen to make one meaning.`;
    }

    // The base form to look up in the dictionary ("helmets" -> "helmet", "woke" -> "wake")
    let lookup = w;
    if (tok.root && tok.root !== w && ['noun', 'verb', 'adjective', 'adverb'].includes(tok.cls)) lookup = tok.root;
    if (tok.cls === 'verb' && has(tok, 'Copula')) lookup = 'be';
    if (tok.contraction) lookup = bare(tok.parts[0].implicit || tok.parts[0].text);

    return {
      word,
      cls: tok.cls,
      label: info.label,
      subLabel,
      emoji: info.emoji,
      meaning: `${q(word)} is ${article(subLabel || info.label)} ${subLabel || info.label.toLowerCase()}. ${info.kid}`,
      reasons,
      note,
      sentence: sentenceText(all, tok),
      lookup,
      form: inflectionOf(tok),
    };
  }

  function article(s) { return /^[aeiou]/i.test(s) ? 'an' : 'a'; }

  function tenseSwap(w, tok) {
    const base = tok.root && tok.root !== w ? tok.root : baseVerb(w);
    if (tok.sub === 'past') return `today: ${WF.verbForm(base, /^(i|you|we|they)$/.test(w) ? 'base' : 'present3')} / yesterday: ${w}`;
    return `today: ${w} / yesterday: ${WF.verbForm(base, 'past')}`;
  }

  // ---- word forms (see wordforms.js)
  const LEX = (() => { try { return nlp.model().one.lexicon; } catch (e) { return {}; } })();
  const knownWord = (w) => !!LEX[w] && !/Pronoun|Determiner|Preposition|Conjunction|Possessive/.test(String(LEX[w]));
  /** petrified -> petrify, ran -> run, gleaming -> gleam */
  function baseVerb(word) {
    const w = String(word).toLowerCase();
    if (LEX[w] === 'Infinitive') return w;            // already a base verb (focus, bring)
    return WF.baseVerb(w, knownWord);
  }
  /** { present3, past, ing } for any form of a verb */
  function conjugate(word) {
    const base = baseVerb(word);
    return { base, present3: WF.verbForm(base, 'present3'), past: WF.verbForm(base, 'past'), ing: WF.verbForm(base, 'ing') };
  }

  function looksLikeVerb(stem) {
    try {
      return [stem, stem + 'e', stem.replace(/(.)\1$/, '$1')].some((s) => s.length > 2 && nlp(s).has('#Verb'));
    } catch (e) { return false; }
  }

  // The subject of the verb at index i: the noun/pronoun just before it,
  // allowing helping verbs, adverbs and 'not' in between.
  function subjectOf(ts, i) {
    for (let k = i - 1; k >= 0 && k >= i - 4; k--) {
      const t = ts[k];
      if (/[,;:]/.test(t.post)) return null;
      if (t.cls === 'pronoun' && (t.sub === 'relative' || t.sub === 'object')) return null;
      if (isSubject(t)) return t;
      if (!(t.cls === 'verb' && (t.sub === 'auxiliary' || t.sub === 'modal')) && t.cls !== 'adverb') return null;
    }
    return null;
  }
  function doingPhrase(ts, i, subj) {
    const tok = ts[i];
    const plural = subj.sub === 'plural' || ['we', 'they', 'you', 'i'].includes(bare(subj.normal));
    const helper = findPrev(ts, i, (t) => t.cls === 'verb' && (t.sub === 'auxiliary' || t.sub === 'modal' || t.sub === 'being'), 3);
    if (helper && ts.indexOf(helper) > ts.indexOf(subj)) return `${bare(helper.normal)} ${tok.sub === 'ing' ? 'doing' : 'do'}`;
    if (tok.sub === 'past') return 'did';
    return plural ? 'do' : 'does';
  }
  // the noun an adjective describes: the next noun, skipping other adjectives,
  // adverbs and commas between adjectives ("the big, red ball")
  function describedNoun(ts, i) {
    for (let k = i + 1; k < ts.length && k <= i + 5; k++) {
      const t = ts[k];
      if (isNoun(t)) return /[.;:!?]/.test(ts[k - 1].post) ? null : t;
      if (!['adjective', 'adverb'].includes(t.cls) && !(t.cls === 'conjunction' && bare(t.normal) === 'and')) return null;
      if (/[.;:!?]/.test(ts[k - 1].post)) return null;
    }
    return null;
  }

  /** describe how the word was changed from its base form, used to inflect synonyms */
  function inflectionOf(tok) {
    if (tok.cls === 'verb') {
      if (has(tok, 'PastTense')) return 'past';
      if (has(tok, 'Gerund')) return 'ing';
      if (has(tok, 'PresentTense') && /s$/.test(bare(tok.normal)) && !has(tok, 'Infinitive')) return 'present3';
    }
    if (tok.cls === 'noun' && tok.sub === 'plural') return 'plural';
    if (tok.cls === 'adjective' && tok.sub === 'comparative') return 'comparative';
    if (tok.cls === 'adjective' && tok.sub === 'superlative') return 'superlative';
    return null;
  }

  /** make a synonym match the form of the original word, e.g. awaken -> awakened. Null if it can't be done. */
  function inflect(word, form) { return WF.inflect(word, form); }

  return { CLASSES, ORDER, analyse, explain, inflect, baseVerb, conjugate };
});
