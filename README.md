# Deckwright

Turn a plain-language prompt into a presentation — a real `.pptx` with a narrative,
assertion titles, varied layouts, and speaker notes on every slide.

Claude writes the deck as a structured spec; a renderer draws it. The model never
emits XML, and the renderer never invents content.

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...

npm start                 # web UI at http://localhost:3000
node cli.js "Make the case for migrating off the legacy job runner" -n 8 -o deck.pptx
```

No key handy? `npm run demo` (CLI) or `DEMO_MODE=1 npm start` (server) renders a
built-in fixture deck so you can see the output without an API call.

## What it produces

Every deck comes back with:

- **A core message** — one sentence the whole deck argues for.
- **Assertion titles** — "Cache misses drive most slow requests", not "Cache Analysis".
  Read only the titles and you get the argument.
- **Nine layouts**, varied deliberately: title, section, bullets, stat, two-column,
  comparison, process, quote, closing. Every one draws a real visual element.
- **Speaker notes on every slide** — the spoken track, 60-90 seconds, ending with the
  transition into the next slide.
- **`needs_data`** — figures the deck wanted but you never supplied. It reports them
  instead of inventing them, and projections stay labelled as projections.

## Interfaces

### Web

`npm start`, then describe the talk. You get a live preview, the outline, the
assumptions the model made, anything it still needs data for, and a `.pptx` download.

### CLI

```
node cli.js "<what the deck is about>" [options]

  -o, --out <path>       Output .pptx path            (default out/deck.pptx)
  -a, --audience <text>  Who is in the room
  -p, --purpose <text>   inform | persuade | teach | report | pitch
  -n, --slides <n>       Number of content slides
  -t, --tone <text>      e.g. "conversational", "academic"
      --html             Also write a self-contained HTML deck
      --json             Also write the deck spec as JSON
      --demo             Use the built-in fixture; makes no API call
```

### HTTP

```
GET  /api/health                 → { ok, demo_mode, api_key_present }
POST /api/generate               → { id, deck, usage, pptx_url, preview_url }
     { prompt, audience?, purpose?, slideCount?, tone?, demo? }
GET  /api/deck/:id.pptx          → the file
GET  /preview/:id                → self-contained HTML deck
```

## How it works

```
prompt ──► src/systemPrompt.js ──► Claude (claude-opus-5)
                                     │  structured output, deckSchema
                                     ▼
                                 deck spec (JSON)
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
              src/render/pptx.js         src/render/html.js
                  (pptxgenjs)             (self-contained HTML)
```

| File | Role |
|---|---|
| `src/systemPrompt.js` | The prompt. This is the actual product — the renderers only draw what it asks for. |
| `src/deckSchema.js` | The model↔renderer contract, enforced by structured outputs. |
| `src/theme.js` | Ten palettes, the type scale, and the content band layouts fill. |
| `src/render/pptx.js` | Deck spec → `.pptx`. |
| `src/render/html.js` | Deck spec → one self-contained HTML file. |
| `src/generate.js` | The API call: structured output, refusal handling, typed errors. |
| `server.js` / `cli.js` | The two front doors. |

The prompt is a narrowed version of [`prompts/presentation-agent.md`](prompts/presentation-agent.md),
which is the same guidance written for a human to hand to any agent.

## Design decisions worth knowing

**The model returns a spec, not a file.** Structured outputs (`messages.parse` with a
JSON schema) mean the model is validated against `deckSchema` before anything is drawn.
A malformed deck fails loudly at the boundary instead of producing a corrupt file.

**Layouts fill a content band.** `theme.BAND` defines the vertical space between the
title and the page number, and every layout distributes through it. Content clustered in
the top half with an empty lower third is the most visible tell of a generated deck.

**No invented numbers.** The prompt forbids it and the schema gives the model somewhere
else to put the need (`needs_data`, and `projected` on every stat). Both surface in the
UI and the CLI output.

**No decorative stripes.** No accent bars, no rules under titles, no edge stripes. The
repeating motif is a circle — numbered on content slides, oversized and translucent on
dark ones.

## Tests

```bash
npm test
```

Runs without a key or network. The drift it guards against is a layout in the schema
that no renderer draws (and the reverse) — that produces blank slides at runtime rather
than an error, so it is checked directly, along with palette completeness, notes landing
in the notes parts, and HTML escaping of deck content.

## Requirements

Node 18+. `ANTHROPIC_API_KEY` for real generation; nothing but Node for `--demo`.
