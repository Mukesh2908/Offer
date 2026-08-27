'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { generateDeck, GenerationError } = require('./src/generate');
const { renderPptx } = require('./src/render/pptx');
const { renderHtml } = require('./src/render/html');
const { demoDeck } = require('./src/demoDeck');

const PORT = Number(process.env.PORT) || 3000;
const OUT_DIR = path.join(__dirname, 'out');
// Set DEMO_MODE=1 to serve the fixture deck instead of calling the API. Useful
// for exercising the renderers and the UI without a key or a bill.
const DEMO_MODE = process.env.DEMO_MODE === '1';

fs.mkdirSync(OUT_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    demo_mode: DEMO_MODE,
    api_key_present: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.post('/api/generate', async (req, res) => {
  const { prompt, audience, purpose, slideCount, tone, demo } = req.body || {};
  const useDemo = DEMO_MODE || demo === true;

  try {
    let deck;
    let usage = null;

    if (useDemo) {
      deck = demoDeck;
    } else {
      const result = await generateDeck({
        prompt,
        audience,
        purpose,
        slideCount: slideCount ? Number(slideCount) : undefined,
        tone,
      });
      deck = result.deck;
      usage = result.usage;
    }

    const id = crypto.randomBytes(6).toString('hex');
    const pptxPath = path.join(OUT_DIR, `${id}.pptx`);
    const htmlPath = path.join(OUT_DIR, `${id}.html`);

    await renderPptx(deck, pptxPath);
    fs.writeFileSync(htmlPath, renderHtml(deck));

    res.json({
      id,
      deck,
      usage,
      demo: useDemo,
      pptx_url: `/api/deck/${id}.pptx`,
      preview_url: `/preview/${id}`,
    });
  } catch (err) {
    if (err instanceof GenerationError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('generate failed:', err);
    res.status(500).json({ error: err.message || 'Generation failed.' });
  }
});

// Ids are hex generated above; the guard keeps a crafted id from escaping OUT_DIR.
const isId = (id) => /^[a-f0-9]{12}$/.test(id);

app.get('/api/deck/:id.pptx', (req, res) => {
  const id = req.params.id;
  if (!isId(id)) return res.status(400).send('Bad id');
  const file = path.join(OUT_DIR, `${id}.pptx`);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.download(file, 'deck.pptx');
});

app.get('/preview/:id', (req, res) => {
  const id = req.params.id;
  if (!isId(id)) return res.status(400).send('Bad id');
  const file = path.join(OUT_DIR, `${id}.html`);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.type('html').send(fs.readFileSync(file, 'utf8'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Deckwright on http://localhost:${PORT}`);
    if (DEMO_MODE) console.log('DEMO_MODE=1 — serving the fixture deck, no API calls.');
    else if (!process.env.ANTHROPIC_API_KEY) {
      console.log('No ANTHROPIC_API_KEY set — generation will return 401. Set the key, or DEMO_MODE=1.');
    }
  });
}

module.exports = app;
