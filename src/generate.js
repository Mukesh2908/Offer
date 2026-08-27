'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { jsonSchemaOutputFormat } = require('@anthropic-ai/sdk/helpers/json-schema');
const { deckSchema } = require('./deckSchema');
const { SYSTEM_PROMPT, buildUserMessage } = require('./systemPrompt');

const MODEL = 'claude-opus-5';
// Used only to rescue a policy refusal, so a benign prompt that trips a
// classifier still returns a deck instead of an error.
const FALLBACK_MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 16000;

class GenerationError extends Error {
  constructor(message, { status } = {}) {
    super(message);
    this.name = 'GenerationError';
    this.status = status || 502;
  }
}

function makeClient(apiKey) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new GenerationError(
      'No ANTHROPIC_API_KEY set. Export a key, or run with --demo (CLI) / DEMO_MODE=1 (server) to exercise the renderer without one.',
      { status: 401 }
    );
  }
  return new Anthropic({ apiKey: key });
}

/**
 * One structured-output call. Split out so the refusal path can re-run it
 * against a different model without duplicating the request shape.
 */
async function callModel(client, model, userMessage, useThinking) {
  const request = {
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    output_config: { format: jsonSchemaOutputFormat(deckSchema) },
  };
  // Adaptive thinking materially improves the narrative structure. It is
  // requested separately so that a model or endpoint that rejects the parameter
  // degrades to a plain call rather than failing the request outright.
  if (useThinking) request.thinking = { type: 'adaptive' };
  return client.messages.parse(request);
}

/**
 * Turns a plain-language brief into a validated deck spec.
 *
 * @param {object} opts
 * @param {string} opts.prompt      What the deck is about. Required.
 * @param {string} [opts.audience]  Who is in the room.
 * @param {string} [opts.purpose]   inform | persuade | teach | report | pitch
 * @param {number} [opts.slideCount]
 * @param {string} [opts.tone]
 * @param {string} [opts.apiKey]    Overrides ANTHROPIC_API_KEY.
 * @returns {Promise<object>} deck spec matching deckSchema
 */
async function generateDeck(opts) {
  if (!opts || !opts.prompt || !String(opts.prompt).trim()) {
    throw new GenerationError('A prompt is required.', { status: 400 });
  }

  const client = makeClient(opts.apiKey);
  const userMessage = buildUserMessage(opts);

  let response;
  try {
    response = await callModel(client, MODEL, userMessage, true);
  } catch (err) {
    if (err instanceof Anthropic.BadRequestError && /thinking/i.test(err.message || '')) {
      response = await callModel(client, MODEL, userMessage, false);
    } else if (err instanceof Anthropic.AuthenticationError) {
      throw new GenerationError('The API key was rejected.', { status: 401 });
    } else if (err instanceof Anthropic.RateLimitError) {
      throw new GenerationError('Rate limited by the API. Retry shortly.', { status: 429 });
    } else if (err instanceof Anthropic.APIConnectionError) {
      throw new GenerationError(`Could not reach the API: ${err.message}`, { status: 503 });
    } else {
      throw err;
    }
  }

  // A refusal is a completed response, not an exception — check before reading
  // content. Re-running once on a different model rescues borderline classifier
  // calls; a second refusal is final.
  if (response.stop_reason === 'refusal') {
    response = await callModel(client, FALLBACK_MODEL, userMessage, true);
    if (response.stop_reason === 'refusal') {
      throw new GenerationError(
        'The model declined this request. Rephrase the brief and try again.',
        { status: 422 }
      );
    }
  }

  const deck = response.parsed_output;
  if (!deck) {
    throw new GenerationError(
      response.stop_reason === 'max_tokens'
        ? 'The deck was cut off before it finished. Ask for fewer slides.'
        : 'The model returned no parseable deck.',
      { status: 502 }
    );
  }

  return {
    deck,
    usage: {
      model: response.model,
      input_tokens: response.usage && response.usage.input_tokens,
      output_tokens: response.usage && response.usage.output_tokens,
    },
  };
}

module.exports = { generateDeck, GenerationError, MODEL };
