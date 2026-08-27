'use strict';

const pptxgen = require('pptxgenjs');
const { getPalette, FONTS, TYPE, SLIDE, BAND } = require('../theme');

/**
 * DeckSpec -> .pptx
 *
 * Every layout branch draws at least one non-text element, and every one fills
 * the content band (theme.BAND) top to bottom. The repeating motif is a filled
 * circle: numbered on content slides, oversized and translucent on dark ones.
 * Deliberately absent: edge stripes, header bars, and rules under titles — the
 * tells of a generated deck.
 *
 * pptxgenjs mutates option objects in place (values are converted to EMU on
 * first use), so every add* call below builds its own fresh object literal.
 * Never hoist one into a shared const.
 */

const M = SLIDE.margin;
const CONTENT_W = SLIDE.w - M * 2;

/** Title block for a light content slide. Height fits two wrapped lines at 32pt. */
function addSlideTitle(slide, text, pal) {
  slide.addText(text, {
    x: M, y: 0.55, w: CONTENT_W, h: 1.2,
    fontSize: TYPE.slideTitle, fontFace: FONTS.heading, bold: true,
    color: pal.onLight, align: 'left', valign: 'top',
    isTextBox: true, margin: 0,
  });
}

/** The motif: an oversized, mostly-transparent circle bleeding off one corner. */
function addDarkMotif(slide, pal) {
  slide.addShape('ellipse', {
    x: SLIDE.w - 2.6, y: -1.5, w: 4.4, h: 4.4,
    fill: { color: pal.accent, transparency: 82 },
    line: { type: 'none' },
  });
}

/** Small numbered circle used as the content-slide motif. */
function addNumberBadge(slide, n, pal, x, y, dia) {
  slide.addShape('ellipse', {
    x, y, w: dia, h: dia,
    fill: { color: pal.accent }, line: { type: 'none' },
  });
  slide.addText(String(n), {
    x, y, w: dia, h: dia,
    fontSize: 13, fontFace: FONTS.body, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle', isTextBox: true, margin: 0,
  });
}

function addPageNumber(slide, n, pal) {
  slide.addText(String(n), {
    x: SLIDE.w - M - 0.6, y: SLIDE.h - 0.62, w: 0.6, h: 0.3,
    fontSize: TYPE.caption, fontFace: FONTS.body, color: pal.muted,
    align: 'right', valign: 'middle', isTextBox: true, margin: 0,
  });
}

/* ------------------------------- layouts -------------------------------- */

function renderTitle(slide, s, pal, deck) {
  slide.background = { color: pal.dark };
  addDarkMotif(slide, pal);
  slide.addText(s.title || deck.title, {
    x: 0.95, y: 2.2, w: 9.9, h: 2.1,
    fontSize: TYPE.deckTitle, fontFace: FONTS.heading, bold: true,
    color: pal.onDark, align: 'left', valign: 'bottom',
    isTextBox: true, margin: 0,
  });
  if (s.subtitle || deck.subtitle) {
    slide.addText(s.subtitle || deck.subtitle, {
      x: 0.95, y: 4.6, w: 9.4, h: 0.9,
      fontSize: 18, fontFace: FONTS.body, color: pal.accentLight,
      align: 'left', valign: 'top', isTextBox: true, margin: 0,
    });
  }
}

function renderSection(slide, s, pal, n) {
  slide.background = { color: pal.dark };
  addDarkMotif(slide, pal);
  slide.addText(String(n).padStart(2, '0'), {
    x: 0.95, y: 2.5, w: 1.6, h: 0.7,
    fontSize: 20, fontFace: FONTS.body, bold: true, color: pal.accentLight,
    align: 'left', valign: 'middle', isTextBox: true, margin: 0,
  });
  slide.addText(s.title, {
    x: 0.95, y: 3.25, w: 9.6, h: 1.9,
    fontSize: TYPE.sectionTitle, fontFace: FONTS.heading, bold: true,
    color: pal.onDark, align: 'left', valign: 'top', isTextBox: true, margin: 0,
  });
}

function renderBullets(slide, s, pal) {
  slide.background = { color: pal.light };
  addSlideTitle(slide, s.title, pal);
  const rows = (s.bullets || []).slice(0, 5);
  if (!rows.length) return;

  // Distribute rows through the whole band rather than stacking them at a fixed
  // pitch under the title, which leaves the lower third of the slide empty.
  const slot = BAND.height / rows.length;
  const rowH = 0.5;

  rows.forEach((row, i) => {
    const centre = BAND.top + slot * (i + 0.5);
    const y = centre - rowH / 2;
    addNumberBadge(slide, i + 1, pal, M, centre - 0.23, 0.46);
    slide.addText(row.heading, {
      x: M + 0.72, y, w: 3.3, h: rowH,
      fontSize: TYPE.heading, fontFace: FONTS.body, bold: true,
      color: pal.onLight, align: 'left', valign: 'middle',
      isTextBox: true, margin: 0,
    });
    slide.addText(row.detail, {
      x: M + 4.15, y, w: CONTENT_W - 4.15, h: rowH,
      fontSize: TYPE.body, fontFace: FONTS.body, color: pal.muted,
      align: 'left', valign: 'middle', isTextBox: true, margin: 0,
    });
  });
}

function renderStat(slide, s, pal) {
  slide.background = { color: pal.light };
  addSlideTitle(slide, s.title, pal);
  const stats = (s.stats || []).slice(0, 3);
  const n = Math.max(stats.length, 1);
  const gutter = 0.4;
  const cardW = (CONTENT_W - gutter * (n - 1)) / n;

  stats.forEach((stat, i) => {
    const x = M + i * (cardW + gutter);
    slide.addShape('roundRect', {
      x, y: BAND.top, w: cardW, h: BAND.height, rectRadius: 0.05,
      fill: { color: pal.tint }, line: { type: 'none' },
    });
    slide.addText(stat.value, {
      x: x + 0.3, y: BAND.top + 0.75, w: cardW - 0.6, h: 1.7,
      fontSize: TYPE.statValue, fontFace: FONTS.heading, bold: true,
      color: pal.accent, align: 'left', valign: 'middle',
      isTextBox: true, margin: 0,
    });
    slide.addText(stat.label, {
      x: x + 0.3, y: BAND.top + 2.65, w: cardW - 0.6, h: 0.95,
      fontSize: TYPE.statLabel, fontFace: FONTS.body,
      color: pal.onLight, align: 'left', valign: 'top',
      isTextBox: true, margin: 0,
    });
    if (stat.projected) {
      slide.addText('projected, not measured', {
        x: x + 0.3, y: BAND.top + 3.65, w: cardW - 0.6, h: 0.3,
        fontSize: TYPE.caption, fontFace: FONTS.body, italic: true,
        color: pal.muted, align: 'left', valign: 'middle',
        isTextBox: true, margin: 0,
      });
    }
  });
}

/** Shared card renderer for two_column and comparison. */
function renderColumns(slide, s, pal, { contrastSecond }) {
  slide.background = { color: pal.light };
  addSlideTitle(slide, s.title, pal);
  const cols = (s.columns || []).slice(0, 2);
  const gutter = 0.45;
  const cardW = (CONTENT_W - gutter) / 2;

  cols.forEach((col, i) => {
    const x = M + i * (cardW + gutter);
    // On a comparison the second card carries noticeably more accent, so the
    // two sides read as opposed at a glance rather than as a matched pair.
    const fill = contrastSecond && i === 1
      ? { color: pal.accent, transparency: 76 }
      : { color: pal.tint };
    slide.addShape('roundRect', {
      x, y: BAND.top, w: cardW, h: BAND.height, rectRadius: 0.05,
      fill, line: { type: 'none' },
    });
    addNumberBadge(slide, i + 1, pal, x + 0.35, BAND.top + 0.38, 0.44);
    slide.addText(col.heading, {
      x: x + 0.95, y: BAND.top + 0.35, w: cardW - 1.3, h: 0.5,
      fontSize: TYPE.heading, fontFace: FONTS.body, bold: true,
      color: pal.onLight, align: 'left', valign: 'middle',
      isTextBox: true, margin: 0,
    });
    const points = (col.points || []).slice(0, 4);
    if (points.length) {
      slide.addText(
        points.map((p, j) => ({
          text: p,
          options: { bullet: true, breakLine: j !== points.length - 1 },
        })),
        {
          x: x + 0.4, y: BAND.top + 1.15, w: cardW - 0.8, h: BAND.height - 1.55,
          fontSize: TYPE.body, fontFace: FONTS.body, color: pal.onLight,
          align: 'left', valign: 'top', paraSpaceAfter: 10,
          isTextBox: true, margin: 0,
        }
      );
    }
  });
}

function renderProcess(slide, s, pal) {
  slide.background = { color: pal.light };
  addSlideTitle(slide, s.title, pal);
  const steps = (s.steps || []).slice(0, 5);
  const n = Math.max(steps.length, 1);
  const gutter = 0.16;
  const stepW = (CONTENT_W - gutter * (n - 1)) / n;
  const chevY = BAND.top + 0.65;
  const chevH = 1.35;

  steps.forEach((step, i) => {
    const x = M + i * (stepW + gutter);
    // Chevrons carry the sequence; the deepening tint shows direction.
    slide.addShape('chevron', {
      x, y: chevY, w: stepW, h: chevH,
      fill: { color: pal.accent, transparency: Math.max(0, 58 - i * 13) },
      line: { type: 'none' },
    });
    slide.addText(step.label, {
      x: x + 0.22, y: chevY, w: stepW - 0.4, h: chevH,
      fontSize: 15, fontFace: FONTS.body, bold: true, color: pal.onLight,
      align: 'center', valign: 'middle', isTextBox: true, margin: 0,
    });
    slide.addText(step.detail, {
      x: x + 0.1, y: chevY + chevH + 0.3, w: stepW - 0.2, h: 1.6,
      fontSize: 13, fontFace: FONTS.body, color: pal.muted,
      align: 'center', valign: 'top', isTextBox: true, margin: 0,
    });
  });
}

function renderQuote(slide, s, pal) {
  slide.background = { color: pal.dark };
  addDarkMotif(slide, pal);
  slide.addText(`“${s.quote || s.title}”`, {
    x: 1.2, y: 2.3, w: 9.6, h: 2.8,
    fontSize: 28, fontFace: FONTS.heading, italic: true, color: pal.onDark,
    align: 'left', valign: 'middle', isTextBox: true, margin: 0,
  });
  if (s.attribution) {
    slide.addText(s.attribution, {
      x: 1.2, y: 5.4, w: 9.6, h: 0.5,
      fontSize: 14, fontFace: FONTS.body, color: pal.accentLight,
      align: 'left', valign: 'top', isTextBox: true, margin: 0,
    });
  }
}

function renderClosing(slide, s, pal, deck) {
  slide.background = { color: pal.dark };
  addDarkMotif(slide, pal);
  slide.addText(s.title, {
    x: 0.95, y: 1.95, w: 9.9, h: 1.75,
    fontSize: TYPE.sectionTitle, fontFace: FONTS.heading, bold: true,
    color: pal.onDark, align: 'left', valign: 'bottom',
    isTextBox: true, margin: 0,
  });
  const points = (s.bullets || []).map((b) => `${b.heading} — ${b.detail}`);
  if (points.length) {
    slide.addText(
      points.map((p, j) => ({
        text: p,
        options: { bullet: true, breakLine: j !== points.length - 1 },
      })),
      {
        x: 0.95, y: 4.2, w: 9.4, h: 2.35,
        fontSize: 16, fontFace: FONTS.body, color: pal.onDark,
        align: 'left', valign: 'top', paraSpaceAfter: 12,
        isTextBox: true, margin: 0,
      }
    );
  } else if (deck.core_message) {
    slide.addText(deck.core_message, {
      x: 0.95, y: 4.2, w: 9.4, h: 1.8,
      fontSize: 18, fontFace: FONTS.body, color: pal.accentLight,
      align: 'left', valign: 'top', isTextBox: true, margin: 0,
    });
  }
}

const DARK_LAYOUTS = new Set(['title', 'section', 'quote', 'closing']);

/**
 * Renders the spec and writes it to `outPath`. Returns the path written.
 */
async function renderPptx(deck, outPath) {
  const pal = getPalette(deck.palette);
  const pres = new pptxgen();

  // Must precede addSlide: coordinates are written, not clamped.
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'Deckwright';
  pres.title = deck.title;

  let pageNo = 0;
  deck.slides.forEach((s, idx) => {
    const slide = pres.addSlide();

    switch (s.layout) {
      case 'title':      renderTitle(slide, s, pal, deck); break;
      case 'section':    renderSection(slide, s, pal, idx + 1); break;
      case 'stat':       renderStat(slide, s, pal); break;
      case 'two_column': renderColumns(slide, s, pal, { contrastSecond: false }); break;
      case 'comparison': renderColumns(slide, s, pal, { contrastSecond: true }); break;
      case 'process':    renderProcess(slide, s, pal); break;
      case 'quote':      renderQuote(slide, s, pal); break;
      case 'closing':    renderClosing(slide, s, pal, deck); break;
      case 'bullets':
      default:           renderBullets(slide, s, pal); break;
    }

    if (!DARK_LAYOUTS.has(s.layout)) {
      pageNo += 1;
      addPageNumber(slide, pageNo, pal);
    }

    // Speaker notes go in the notes part, never a text box on the slide.
    let notes = s.notes || '';
    const isLast = idx === deck.slides.length - 1;
    if (isLast && deck.needs_data && deck.needs_data.length) {
      notes += `\n\nSTILL NEEDED (not invented — supply before presenting):\n` +
        deck.needs_data.map((d) => `- ${d}`).join('\n');
    }
    if (notes) slide.addNotes(notes);
  });

  await pres.writeFile({ fileName: outPath });
  return outPath;
}

module.exports = { renderPptx };
