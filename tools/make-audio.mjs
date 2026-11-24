// Makes the pre-recorded audio for the fixed example sentences
// (Figurative Language and Alan Peat Sentences), using the free Kokoro voice.
//
// The recordings are made once, on a computer, and saved as small MP3 files
// in audio/. Pupils' devices just play them – nothing extra is downloaded.
//
// One-off setup in an empty folder OUTSIDE the website (needs ffmpeg installed):
//   npm install kokoro-js@1.2.1 --onnxruntime-node-install-cuda=skip
// Then run from that folder:
//   WTW_ROOT=/path/to/What-s-that-Word- node /path/to/What-s-that-Word-/tools/make-audio.mjs
// Existing recordings are kept; only new or changed sentences are recorded.
//
// Kokoro-82M is licensed Apache-2.0 (https://huggingface.co/hexgrad/Kokoro-82M).
import { KokoroTTS } from 'kokoro-js';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = process.env.WTW_ROOT || path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const F = require(path.join(ROOT, 'js/figurative.js'));
const P = require(path.join(ROOT, 'js/peat.js'));
const A = require(path.join(ROOT, 'js/audioclips.js'));

const VOICE = process.env.WTW_VOICE || 'bf_emma';   // a British English voice
const SPEED = 0.92;                                  // a little slower than normal, for children
const OUT = path.join(ROOT, 'audio');
fs.mkdirSync(OUT, { recursive: true });

// every fixed sentence that has a 🔊 button
const texts = new Map();
F.DEVICES.forEach((d) => d.examples.forEach((e) => texts.set(A.key(F.plain(e.t)), F.plain(e.t))));
P.TYPES.forEach((t) => t.examples.forEach((e) => texts.set(A.key(P.plain(e)), P.plain(e))));

const indexFile = path.join(OUT, 'index.json');
const old = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { clips: {} };
const index = { voice: VOICE, model: 'Kokoro-82M v1.0 (Apache-2.0)', clips: {} };

const todo = [...texts].filter(([k]) => !(old.clips[k] && old.voice === VOICE && fs.existsSync(path.join(OUT, old.clips[k]))));
console.log(`${texts.size} sentences, ${todo.length} to record with ${VOICE}.`);
const tts = todo.length ? await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' }) : null;

let n = 0;
for (const [k, text] of texts) {
  const file = `${k}.mp3`;
  if (todo.some(([t]) => t === k)) {
    const audio = await tts.generate(A.speakable(text), { voice: VOICE, speed: SPEED });
    const wav = path.join(OUT, `${k}.wav`);
    await audio.save(wav);
    // small mono MP3, which plays on every phone, tablet and browser
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '40k', path.join(OUT, file)]);
    fs.unlinkSync(wav);
    n++;
    if (n % 20 === 0) console.log(`  ${n}/${todo.length}`);
  }
  index.clips[k] = file;
}
// remove recordings of sentences that no longer exist
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.mp3') && !Object.values(index.clips).includes(f)) fs.unlinkSync(path.join(OUT, f));
}
fs.writeFileSync(indexFile, JSON.stringify(index, null, 0));
console.log(`Done: ${n} recorded, ${texts.size} in total.`);
