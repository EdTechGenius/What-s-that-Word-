# What's That Word?

A classroom text tool for teachers and pupils that works in any web browser and on iPad.

## The corners

### ✏️ Glorious Grammar Corner
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
  * **Hear it** (read aloud), **Word lab** (opens the Vocabulary Corner) and **Add to word bank**
* There are also controls for text size, labels, colours, reading the whole text aloud, and printing.

### 📖 Vivid Vocabulary Corner
* Type any word to get its pronunciation, every word class it can belong to, its definitions with examples, synonyms and opposites.
* The thesaurus panel groups similar words by word class. For nouns it suggests **adjectives to describe** the noun, and for adjectives it lists the things they can describe.
* Spelling suggestions ("Did you mean…?") appear when a word isn't found.

### ⭐ My Word Bank
* Words saved from either corner, with their word class, meaning, the sentence they came from, and synonyms.
* Pupils can filter by word class, search, hear a word, look it up again, remove words and print the bank.
* The bank is saved on the device, in the browser (it is not shared between devices).

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
| `js/lookup.js` | Gets definitions from the [Free Dictionary API](https://dictionaryapi.dev) (Wiktionary data) and synonyms from [Datamuse](https://www.datamuse.com/api/). Both are free and need no API key. **They need an internet connection.** |
| `js/app.js` | The pages, word cards, read-aloud and word bank. |
| `sw.js` | Lets the app open offline and remembers words that were looked up before. |

Automatic grammar tagging is very good but not perfect. English words often change class depending on how they are used, and the tool will occasionally get a word wrong. That can make a good class discussion: "Do you agree? Why?"

Run the grammar checks with:

```bash
node tests/grammar.test.js
```
