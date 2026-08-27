#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');

const { generateDeck, GenerationError } = require('./src/generate');
const { renderPptx } = require('./src/render/pptx');
const { renderHtml } = require('./src/render/html');
const { demoDeck } = require('./src/demoDeck');

const USAGE = `Deckwright — turn a prompt into a presentation.

  deckwright "<what the deck is about>" [options]

Options
  -o, --out <path>       Output .pptx path            (default out/deck.pptx)
  -a, --audience <text>  Who is in the room
  -p, --purpose <text>   inform | persuade | teach | report | pitch
  -n, --slides <n>       Number of content slides
  -t, --tone <text>      e.g. "conversational", "academic"
      --html             Also write a self-contained HTML deck beside the .pptx
      --json             Also write the deck spec as JSON
      --demo             Use the built-in fixture; makes no API call
  -h, --help             Show this

Needs ANTHROPIC_API_KEY in the environment unless --demo is given.`;

function parseArgs(argv) {
  const opts = { out: 'out/deck.pptx' };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '-o': case '--out':      opts.out = next(); break;
      case '-a': case '--audience': opts.audience = next(); break;
      case '-p': case '--purpose':  opts.purpose = next(); break;
      case '-n': case '--slides':   opts.slideCount = Number(next()); break;
      case '-t': case '--tone':     opts.tone = next(); break;
      case '--html':                opts.html = true; break;
      case '--json':                opts.json = true; break;
      case '--demo':                opts.demo = true; break;
      case '-h': case '--help':     opts.help = true; break;
      default:
        if (a.startsWith('-')) { opts.unknown = a; }
        else rest.push(a);
    }
  }
  opts.prompt = rest.join(' ').trim();
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || (!opts.prompt && !opts.demo)) {
    console.log(USAGE);
    process.exit(opts.help ? 0 : 1);
  }
  if (opts.unknown) {
    console.error(`Unknown option: ${opts.unknown}\n`);
    console.log(USAGE);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });

  let deck;
  if (opts.demo) {
    deck = demoDeck;
    console.error('Using the built-in fixture deck (--demo): no API call made.');
  } else {
    console.error('Writing the deck…');
    const result = await generateDeck(opts);
    deck = result.deck;
    console.error(
      `Model ${result.usage.model} — ${result.usage.output_tokens} output tokens.`
    );
  }

  await renderPptx(deck, opts.out);
  console.log(opts.out);

  if (opts.html) {
    const htmlPath = opts.out.replace(/\.pptx$/i, '') + '.html';
    fs.writeFileSync(htmlPath, renderHtml(deck));
    console.log(htmlPath);
  }
  if (opts.json) {
    const jsonPath = opts.out.replace(/\.pptx$/i, '') + '.json';
    fs.writeFileSync(jsonPath, JSON.stringify(deck, null, 2));
    console.log(jsonPath);
  }

  console.error(`\n${deck.slides.length} slides — ${deck.core_message}`);
  if (deck.needs_data && deck.needs_data.length) {
    console.error('\nNeeds data before presenting:');
    deck.needs_data.forEach((d) => console.error(`  - ${d}`));
  }
  if (deck.assumptions && deck.assumptions.length) {
    console.error('\nAssumptions made:');
    deck.assumptions.forEach((d) => console.error(`  - ${d}`));
  }
}

main().catch((err) => {
  if (err instanceof GenerationError) console.error(`\n${err.message}`);
  else console.error('\n' + (err.stack || err.message));
  process.exit(1);
});
