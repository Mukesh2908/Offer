'use strict';

/**
 * Palettes and type scale.
 *
 * Hex values carry no leading '#' — pptxgenjs corrupts the file if you include
 * one, or bake alpha into the hex. Use `transparency` for translucency instead.
 *
 * Each palette has a dark field (title/section/closing slides), a light field
 * (content slides), and one accent reserved for emphasis. That sandwich is what
 * keeps a generated deck from reading as one flat wall of slides.
 */

const PALETTES = {
  midnight_executive: { dark: '1E2761', light: 'FFFFFF', tint: 'EEF2FC', accent: '4A7FE8', accentLight: '9DBBF5', onDark: 'FFFFFF', onLight: '1A1D26', muted: '6B7280' },
  forest_moss:        { dark: '2C5F2D', light: 'FFFFFF', tint: 'EFF4E9', accent: '6E9B3C', accentLight: 'C3DDA0', onDark: 'FFFFFF', onLight: '1F2419', muted: '6B7280' },
  coral_energy:       { dark: '2F3C7E', light: 'FFFFFF', tint: 'FDEEEF', accent: 'F96167', accentLight: 'FF9BA0', onDark: 'FFFFFF', onLight: '241E22', muted: '6B7280' },
  warm_terracotta:    { dark: 'B85042', light: 'FFFFFF', tint: 'F5EFE6', accent: '8A9F92', accentLight: 'D8E4DC', onDark: 'FFFFFF', onLight: '2B211F', muted: '6E635F' },
  ocean_gradient:     { dark: '21295C', light: 'FFFFFF', tint: 'E9F1F5', accent: '1C7293', accentLight: '6FBEDC', onDark: 'FFFFFF', onLight: '15202B', muted: '667685' },
  charcoal_minimal:   { dark: '212121', light: 'FFFFFF', tint: 'F2F2F2', accent: '4A5F6B', accentLight: 'A8BCC8', onDark: 'FFFFFF', onLight: '1A1A1A', muted: '6E6E6E' },
  teal_trust:         { dark: '02515A', light: 'FFFFFF', tint: 'E6F4F1', accent: '028090', accentLight: '5FD3C4', onDark: 'FFFFFF', onLight: '13232B', muted: '61787E' },
  berry_cream:        { dark: '6D2E46', light: 'FFFFFF', tint: 'F7F0E8', accent: 'A26769', accentLight: 'E0B4B6', onDark: 'FFFFFF', onLight: '2A1B21', muted: '6F6259' },
  sage_calm:          { dark: '3F5A63', light: 'FFFFFF', tint: 'EDF3F0', accent: '50808E', accentLight: 'AFD6C4', onDark: 'FFFFFF', onLight: '1D262A', muted: '68797E' },
  cherry_bold:        { dark: '990011', light: 'FFFFFF', tint: 'FCF0F0', accent: '2F3C7E', accentLight: 'FFC2C7', onDark: 'FFFFFF', onLight: '241618', muted: '6E5F60' },
};

const DEFAULT_PALETTE = 'midnight_executive';

// Cambria headings over Calibri body: real typographic contrast, and both render
// true-to-width in LibreOffice, so overflow checks during QA can be trusted.
const FONTS = { heading: 'Cambria', body: 'Calibri' };

// Sizes in points. Titles stay far enough above body text to read from the back
// of a room; captions never drop below 10.
const TYPE = {
  deckTitle: 44,
  slideTitle: 32,
  sectionTitle: 36,
  statValue: 66,
  statLabel: 14,
  heading: 18,
  body: 15,
  caption: 11,
};

// LAYOUT_WIDE. Must be set on the presentation before any slide is added —
// pptxgenjs writes out-of-range coordinates rather than clamping them, so a
// shape placed for 13.3" on a 10" canvas silently vanishes.
const SLIDE = { w: 13.333, h: 7.5, margin: 0.62 };

// The band that content is distributed through, between the title block and the
// page number. Layouts fill it top to bottom — content clustered in the upper
// half with an empty lower third is the most visible flaw in a generated deck.
const BAND = { top: 2.15, bottom: 6.6 };
BAND.height = BAND.bottom - BAND.top;

function getPalette(name) {
  return PALETTES[name] || PALETTES[DEFAULT_PALETTE];
}

module.exports = { PALETTES, DEFAULT_PALETTE, FONTS, TYPE, SLIDE, BAND, getPalette };
