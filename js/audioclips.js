/*
 * audioclips.js — matches a sentence to its pre-recorded audio file.
 * The recordings live in audio/ and are listed in audio/index.json
 * (made by tools/make-audio.mjs). Anything without a recording is read
 * by the device's own voice instead.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AudioClips = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** The same sentence always gets the same short key, e.g. "3f9a0c1d". */
  function key(text) {
    const t = String(text || '').toLowerCase()
      .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...')
      .replace(/\s+/g, ' ').trim();
    let h = 0x811c9dc5;
    for (const ch of t) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  /** Text as it should be spoken: "BOOM!" is read as a word, not spelled out. */
  function speakable(text) {
    return String(text || '')
      .replace(/\b([A-Z]{4,})\b/g, (w) => w.toLowerCase())
      .replace(/…/g, '... ')
      .replace(/\s+/g, ' ').trim();
  }

  return { key, speakable };
});
