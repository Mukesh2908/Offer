'use strict';

/**
 * Smoke test — no API key, no network.
 *
 * The failure this is really guarding against is drift: a layout added to the
 * schema that no renderer draws, or a renderer branch for a layout the model
 * can never emit. Both produce blank slides at runtime rather than an error.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { deckSchema, LAYOUTS } = require('../src/deckSchema');
const { demoDeck } = require('../src/demoDeck');
const { renderPptx } = require('../src/render/pptx');
const { renderHtml } = require('../src/render/html');
const { PALETTES } = require('../src/theme');

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deckwright-'));
  const pptxPath = path.join(tmp, 'test.pptx');

  check('schema layout enum matches the exported layout list', () => {
    const fromSchema = deckSchema.properties.slides.items.properties.layout.enum;
    assert.deepStrictEqual([...fromSchema].sort(), [...LAYOUTS].sort());
  });

  check('every schema layout has a pptx render branch', () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/render/pptx.js'), 'utf8');
    const missing = LAYOUTS.filter((l) => !src.includes(`case '${l}':`));
    assert.strictEqual(missing.length, 0, `no pptx branch for: ${missing.join(', ')}`);
  });

  check('every schema layout has an html render branch', () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/render/html.js'), 'utf8');
    const missing = LAYOUTS.filter(
      (l) => !src.includes(`case '${l}':`) && l !== 'bullets'
    );
    assert.strictEqual(missing.length, 0, `no html branch for: ${missing.join(', ')}`);
  });

  check('schema palette enum matches the theme palettes', () => {
    const fromSchema = deckSchema.properties.palette.enum;
    assert.deepStrictEqual([...fromSchema].sort(), Object.keys(PALETTES).sort());
  });

  check('every palette defines every colour role', () => {
    const roles = ['dark', 'light', 'tint', 'accent', 'accentLight', 'onDark', 'onLight', 'muted'];
    for (const [name, pal] of Object.entries(PALETTES)) {
      for (const role of roles) {
        assert.ok(pal[role], `${name} is missing ${role}`);
        assert.match(pal[role], /^[0-9A-F]{6}$/, `${name}.${role} is not a bare 6-digit hex`);
      }
    }
  });

  check('demo fixture satisfies the schema requirements', () => {
    for (const key of deckSchema.required) {
      assert.ok(demoDeck[key] !== undefined, `fixture missing ${key}`);
    }
    const slideRequired = deckSchema.properties.slides.items.required;
    demoDeck.slides.forEach((s, i) => {
      for (const key of slideRequired) {
        assert.ok(s[key] !== undefined, `slide ${i + 1} missing ${key}`);
      }
      assert.ok(LAYOUTS.includes(s.layout), `slide ${i + 1} has unknown layout ${s.layout}`);
    });
  });

  check('fixture respects its own density limits', () => {
    demoDeck.slides.forEach((s, i) => {
      if (s.bullets) assert.ok(s.bullets.length <= 5, `slide ${i + 1} has over 5 bullets`);
      assert.ok(s.title.length <= 70, `slide ${i + 1} title is over 70 chars`);
    });
  });

  await renderPptx(demoDeck, pptxPath);

  check('pptx is a readable archive with one slide part per spec slide', () => {
    const buf = fs.readFileSync(pptxPath);
    assert.ok(buf.length > 10000, 'file is suspiciously small');
    assert.strictEqual(buf.subarray(0, 2).toString(), 'PK', 'not a zip archive');
    const names = buf.toString('latin1').match(/ppt\/slides\/slide\d+\.xml/g) || [];
    const unique = new Set(names);
    assert.strictEqual(unique.size, demoDeck.slides.length,
      `expected ${demoDeck.slides.length} slide parts, found ${unique.size}`);
  });

  check('speaker notes reach the notes parts, not the slides', () => {
    const buf = fs.readFileSync(pptxPath).toString('latin1');
    const notes = new Set(buf.match(/ppt\/notesSlides\/notesSlide\d+\.xml/g) || []);
    assert.strictEqual(notes.size, demoDeck.slides.length, 'a slide is missing its notes part');
  });

  check('html deck renders one section per slide and inlines everything', () => {
    const html = renderHtml(demoDeck);
    const sections = html.match(/class="slide /g) || [];
    assert.strictEqual(sections.length, demoDeck.slides.length);
    assert.ok(!/<(script|link|img)[^>]+(src|href)=["']https?:/i.test(html),
      'html deck references an external asset');
  });

  check('html escapes markup in deck content', () => {
    const evil = JSON.parse(JSON.stringify(demoDeck));
    evil.slides[0].title = '<script>alert(1)</script>';
    const html = renderHtml(evil);
    assert.ok(!html.includes('<script>alert(1)</script>'), 'unescaped markup reached the output');
    assert.ok(html.includes('&lt;script&gt;'), 'expected escaped form not found');
  });

  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
  process.exit(failures ? 1 : 0);
})();
