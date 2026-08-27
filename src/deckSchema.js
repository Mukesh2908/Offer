'use strict';

/**
 * JSON Schema for the deck spec Claude returns.
 *
 * This is the contract between the model and the renderers: every layout named
 * here must have a matching branch in src/render/pptx.js and src/render/html.js.
 * Keep `additionalProperties: false` — structured outputs enforce the shape, and
 * a silently-dropped field is worse than a validation error.
 */

const LAYOUTS = [
  'title',      // opening slide
  'section',    // divider between acts
  'bullets',    // numbered rows, each with a heading
  'stat',       // 1-3 oversized figures
  'two_column', // two cards side by side
  'comparison', // before/after, tinted differently
  'process',    // numbered horizontal flow
  'quote',      // pull quote on a dark field
  'closing',    // the ask / next steps
];

const deckSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Deck title. Max 60 characters.' },
    subtitle: { type: 'string', description: 'One line under the title. Max 90 characters.' },
    core_message: {
      type: 'string',
      description:
        'One sentence: what the audience believes at the end that they did not believe at the start.',
    },
    palette: {
      type: 'string',
      description: 'Palette name chosen to suit the subject.',
      enum: [
        'midnight_executive', 'forest_moss', 'coral_energy', 'warm_terracotta',
        'ocean_gradient', 'charcoal_minimal', 'teal_trust', 'berry_cream',
        'sage_calm', 'cherry_bold',
      ],
    },
    palette_rationale: {
      type: 'string',
      description: 'One clause on why this palette suits this subject specifically.',
    },
    slides: {
      type: 'array',
      minItems: 3,
      maxItems: 30,
      items: {
        type: 'object',
        properties: {
          layout: { type: 'string', enum: LAYOUTS },
          title: {
            type: 'string',
            description:
              'Assertion title stating the takeaway, not the topic. Max 70 characters.',
          },
          subtitle: { type: 'string', description: 'Optional supporting line. Max 100 characters.' },
          bullets: {
            type: 'array',
            maxItems: 5,
            description: 'For layout=bullets. Max 5 items, each max 10 words.',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string', description: '2-4 word label.' },
                detail: { type: 'string', description: 'One phrase, max 10 words.' },
              },
              required: ['heading', 'detail'],
              additionalProperties: false,
            },
          },
          stats: {
            type: 'array',
            maxItems: 3,
            description: 'For layout=stat. 1-3 oversized figures.',
            items: {
              type: 'object',
              properties: {
                value: { type: 'string', description: 'The figure itself, e.g. "34%" or "3.2x".' },
                label: { type: 'string', description: 'What it measures. Max 8 words.' },
                projected: {
                  type: 'boolean',
                  description: 'True if this is a projection rather than an observed result.',
                },
              },
              required: ['value', 'label', 'projected'],
              additionalProperties: false,
            },
          },
          columns: {
            type: 'array',
            minItems: 2,
            maxItems: 2,
            description: 'For layout=two_column and layout=comparison. Exactly 2.',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                points: { type: 'array', maxItems: 4, items: { type: 'string' } },
              },
              required: ['heading', 'points'],
              additionalProperties: false,
            },
          },
          steps: {
            type: 'array',
            minItems: 2,
            maxItems: 5,
            description: 'For layout=process. 2-5 ordered stages.',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: '1-3 words.' },
                detail: { type: 'string', description: 'One short phrase.' },
              },
              required: ['label', 'detail'],
              additionalProperties: false,
            },
          },
          quote: { type: 'string', description: 'For layout=quote. The quote text.' },
          attribution: { type: 'string', description: 'For layout=quote. Who said it.' },
          notes: {
            type: 'string',
            description:
              'Speaker notes: the spoken track in full sentences, 60-90 seconds of talking, ending with the transition into the next slide.',
          },
        },
        required: ['layout', 'title', 'notes'],
        additionalProperties: false,
      },
    },
    assumptions: {
      type: 'array',
      description: 'Assumptions made because the prompt did not specify them.',
      items: { type: 'string' },
    },
    needs_data: {
      type: 'array',
      description:
        'Figures the deck wants but the source did not supply. Never invent these — list them here instead.',
      items: { type: 'string' },
    },
  },
  required: [
    'title', 'subtitle', 'core_message', 'palette', 'palette_rationale',
    'slides', 'assumptions', 'needs_data',
  ],
  additionalProperties: false,
};

module.exports = { deckSchema, LAYOUTS };
