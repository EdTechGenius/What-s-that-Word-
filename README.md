# What's That Word?

A classroom text tool for teachers and pupils that works in any web browser and on iPad.

## The areas

The menu has three areas, each with an icon and a label:
* **🔍 Explore words**: Glorious Grammar and Vivid Vocabulary
* **✍️ Improve my writing**: Level Up!, Figurative Language and Alan Peat Sentences
* **📓 My Notebook**

Tabs under the top bar switch between the pages in an area.

### ✏️ Glorious Grammar
* Pupils type or paste any text, then press **Colour my words**.
* Every word is highlighted in the colour of its word class: noun, proper noun, verb, adjective, adverb, pronoun, determiner, preposition, conjunction or interjection. A short label (N, V, Adj…) can be shown under each word.
* Tap a word class in the key to show **only** those words, e.g. "find all the adjectives".
* Tap any word to open its card. The card shows:
  * the word class, including the type where it helps (e.g. *past tense verb*, *possessive determiner*, *coordinating conjunction*)
  * a child-friendly explanation of that word class
  * **why** the word belongs to that class in *this* sentence (e.g. "It comes after the determiner 'the'", "It describes the noun 'rows'", "It ends in -ly…"), plus a "Test it" tip
  * the sentence it came from
  * a dictionary definition for the word as it is used here, with an example sentence
  * synonyms (for nouns, verbs, adjectives and adverbs), changed to match the original form: *raced* → *dashed, rushed, sprinted*
  * **Hear it** (read aloud), **Word lab** (opens Vivid Vocabulary) and **Add to notebook**
* There are also controls for text size, labels, colours, reading the whole text aloud, and printing.

### 📖 Vivid Vocabulary
Pupils first choose **Lower primary** or **Upper primary**. The choice is remembered, and they can switch at any time.

**Lower primary**
* Type any word to get its pronunciation, every word class it can belong to, its main meaning with an example (tap **Show more meanings** for the rest), synonyms and opposites.
* The thesaurus panel groups similar words by word class. For nouns it suggests **adjectives to describe** the noun, and for adjectives it lists the things they can describe.

**Upper primary** (everything above, plus):
* A **word level** for the searched word: 👍 Everyday, ✨ Ambitious or 🚀 Challenge, based on how often it is used.
* The two main meanings for each word class it can be (e.g. *petrified* as an adjective **and** as a verb), with more available on tap, **example sentences** in which the word is highlighted, and a grammar tip for using it (including the correct tenses, e.g. *petrifies / petrified / petrifying*).
* A bigger thesaurus for **each** word class, sorted into 🚀 Challenge, ✨ Ambitious and 👍 Everyday words (up to 8 of each).
* **Word detective**: word parts (e.g. *petr* (rock, Greek) + *-ify* (to make) + *-ed*), the word family, and phrases the word is often found in.
* **Your turn**: pupils write their own sentence using the word, and the grammar checker tells them which word class they used it as. It also reminds them about capital letters and end punctuation, and they can save the sentence to their notebook.

Spelling suggestions ("Did you mean…?") appear when a word isn't found. Words and definitions fetched online are changed to British spellings (*fossilized* → *fossilised*, *color* → *colour*).

### 🔤 Dyslexia-friendly font
Switch on **Dyslexia-friendly font** on the home page, or tap **Aa** in the top bar on any page, to show the whole tool in [OpenDyslexic](https://opendyslexic.org) (SIL Open Font License, bundled in `fonts/`). The setting is remembered on that device.

### ⚡ Level Up!
Pupils type or paste their writing and choose **Lower** or **Upper primary** (the same setting as Vivid Vocabulary).
* Plain words such as *said, went, got, nice, big, good, scared, thing* are underlined.
* Tap one to see why it could be improved, and pick a better word to swap in. The new word changes to fit the sentence: *said* → *bellowed*, *bigger* → *more colossal*, and *a big elephant* → *an immense elephant*.
  * **Lower primary:** one set of more exciting words.
  * **Upper primary:** ✨ ambitious and 🚀 challenge words.
* **“very big”**, **“really happy”** and similar phrases are replaced with one powerful word.
* A sentence starting with **“Then”** can become a fronted adverbial (*Moments later, …*), and the comma is added automatically.
* Tap **any other** noun, verb, adjective or adverb to search for upgrades online.

Level Up! has **four ways to level up**, as tabs:
| Tab | What pupils do | Lower primary | Upper primary |
| --- | --- | --- | --- |
| 🔁 Swap words | swap underlined plain words | more exciting words | ✨ ambitious and 🚀 challenge words |
| ➕ Add adverbs | tap a ＋ next to a verb to add an adverb (one per sentence, placed before or after the verb) | *quietly, carefully, happily…* | *hesitantly, stealthily, ravenously…*, chosen to suit the verb (speaking, moving, eating, looking) |
| 🎬 Sentence openers | tap a ＋ at the start of a sentence to add a fronted adverbial (*when / where / how*), or write their own. The comma is added and the next letter becomes lower case | *Later that day, In the distance, Slowly* | *In the dead of night, Beneath the flickering streetlight, With trembling hands* |
| 🔗 Conjunctions | tap a ＋ at the end of a sentence to **join** it to the next one, or **add** a clause in their own words | *and, but, so, or* + *because, when, if, until* | coordinating (FANBOYS) + subordinating (*although, while, unless, whereas, even though…*) |

Each tab shows how many upgrades have been made. Every upgrade can be tapped again to change or remove it.
* Swapped words are highlighted, with stars to show progress and a **Before / After** comparison. Pupils can hear, copy, undo, or save their new words to the notebook.

### 🎨 Figurative Language
Eleven techniques: **simile, metaphor, personification, alliteration, onomatopoeia, hyperbole, idioms, pathetic fallacy, oxymoron, assonance and imagery**, with 129 original examples.
* Each technique has its own page with **What is it?**, **How to spot it**, **How to write your own** and **Why writers use it**.
* Every example has the technique highlighted, **💭 what it means** and **✍️ when to use it**, plus 🔊 read aloud and ⭐ save to their notebook. Assonance examples name the vowel sound, and imagery examples name the sense.
* **What are you writing about?** Pick a theme (weather, sea, spooky, battles, happy, sad, winter…) or search, and see suitable examples from every technique at once.
* **Try it yourself:** a writing challenge for each technique. Similes, metaphors, alliteration and onomatopoeia are checked automatically. Pupils can save their own examples to the notebook.
* All the examples are in `js/figurative.js`, so teachers can add their own.

### 🧱 Alan Peat Sentences
All 22 sentence types from the school's sentence-type cards, in the same colour sets (red, light blue, blue, green): 2A, …as a / …like a, BOYS, 3 ___ed, double ly, ___ing ___ed, verb person, emotion word, noun which/where/who, the more the more, ad same ad, last word first word, De: De, personification of weather, O. (I.), 3 bad – question, if if if then, 2 pairs, some; others, imagine 3 examples, P.C. and one word: definition.
* Each type has its own page with the **formula** (parts in colour), **What is it?**, the **building blocks**, examples with the key parts highlighted (🔊 read aloud) and a top tip.
* **Your turn:** as pupils type, a **success-criteria checklist** ticks off each part, e.g. “Starts with three words ending in -ed ✓”, “A dash after the third word ○”. Pupils then **add their sentence to their examples**.
* **My sentence collection** shows every sentence a pupil has written, grouped by type, with a progress bar of the types they’ve tried. They can copy, print, or save sentences to their notebook.
* All the content is in `js/peat.js`.

### 📓 My Notebook
Each pupil's notebook has two pages:
* **📖 Word bank:** interesting words saved from anywhere in the tool (word cards, Vivid Vocabulary, Level Up! swaps), or typed in by the pupil with an optional meaning. The word class is worked out automatically. Pupils can filter by word class, search, hear a word, look it up again, or remove it.
* **✍️ Sentences:** sentences from Alan Peat Sentences, Figurative Language examples, levelled-up writing (with the original shown underneath), and sentences pupils write straight into the notebook. Pupils can filter by where each sentence came from.
* Both pages can be searched, copied and printed.
* The notebook is saved on the device, in the browser (it is not shared between devices).

## Using it

It is a plain website with no build step and no account, and nothing needs installing.

**Put it online (free) with GitHub Pages:** in the repository go to *Settings → Pages*, choose *Deploy from a branch*, pick the branch and the `/ (root)` folder, then save. The site appears at `https://<your-username>.github.io/<repository-name>/`.

**On iPad:** open the site in Safari, tap **Share → Add to Home Screen**. It then opens full-screen like an app.

**On your own computer:** run any static web server in this folder, e.g.

```bash
python3 -m http.server 8000
```

and open http://localhost:8000.

## How it works

| Part | What it does |
| --- | --- |
| `js/grammar.js` | Tags each word with [compromise](https://github.com/spencermountain/compromise) (MIT licence, bundled in `vendor/`), then applies primary-school grammar conventions (e.g. *their helmets* → determiner, *eighty men* → determiner, *lining up* → adverb) and writes the "why" explanations. This runs on the device, so colouring works offline. |
| `js/lookup.js` | Gets definitions from the [Free Dictionary API](https://dictionaryapi.dev) (Wiktionary data) and synonyms from [Datamuse](https://www.datamuse.com/api/). Example sentences also come from [Wiktionary](https://en.wiktionary.org). All are free and need no API key. **They need an internet connection.** |
| `js/levelup.js` | The plain-word lists and upgrade suggestions for Level Up!, and the rules for spotting them. |
| `js/figurative.js` | All the Figurative Language content (definitions, examples, themes) and the "Try it yourself" checks. |
| `js/peat.js` | The Alan Peat sentence types, examples and checklist rules. |
| `js/wordparts.js` | Splits words into prefixes, roots and suffixes for the Word detective. |
| `js/wordforms.js` | Changes words into their other forms with British spelling rules (*stop → stopped*, *glum → glummer*, *petrified → petrify*) and a table of about 150 irregular verbs. Everything that changes a word's form uses it, so the app never invents words. |
| `js/audioclips.js` and `audio/` | Pre-recorded audio for the fixed example sentences (see below). |
| `js/app.js` | The pages, word cards, read-aloud and the notebook. |
| `sw.js` | Lets the app open offline and remembers words that were looked up before. |

Automatic grammar tagging is very good but not perfect. English words often change class depending on how they are used, and the tool will occasionally get a word wrong. That can make a good class discussion: "Do you agree? Why?"

Run the checks with:

```bash
node tests/grammar.test.js
```

An extra check looks up **every** word form the app can generate in a British English dictionary. It needs two small free packages, used only for this check: nspell (MIT, 42 KB) and dictionary-en-gb (MIT and BSD, 0.6 MB).

```bash
npm install --no-save nspell@2 dictionary-en-gb@3
```

```bash
node tests/dictionary-check.mjs
```

## Read aloud

* The 🔊 buttons on the Figurative Language and Alan Peat example sentences play **pre-recorded audio** made with the free [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) voice (Apache-2.0 licence, British voice *bf_emma*). The recordings are small MP3 files in `audio/`, so nothing extra is downloaded on pupils' devices.
* Everything else (looked-up words, pupils' own writing) is read by the device's own voice, choosing a British voice when one is available.
* After adding or changing example sentences, record the new ones with `tools/make-audio.mjs` (instructions at the top of that file). Sentences without a recording simply use the device's voice.
