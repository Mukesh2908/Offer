# Prompts

[`presentation-agent.md`](presentation-agent.md) — a prompt for an AI agent that builds
slide decks from source material.

Four parts, use what you need:

| Part | What it is |
|---|---|
| **A** | The agent prompt. Paste as a system prompt or agent definition. |
| **B** | The brief template — audience, purpose, length, format, source material. |
| **C** | A filled-in brief showing what a good one looks like. |
| **D** | A compact single-paste version for a plain chat box. |

## How to use

1. Paste **Part A** as the system prompt.
2. Copy **Part B**, fill it in, paste your source material under `SOURCE MATERIAL:`.
3. Send it. `ONE-PASS: no` stops the agent after the outline so you can redirect before it
   spends effort on slides. `ONE-PASS: yes` builds straight through to a file.

No system prompt slot? Use **Part D** on its own.

## What it enforces

- A stated core message, with every slide serving it.
- Assertion titles — skimming the titles reproduces the argument.
- Density limits (5 bullets / 10 words / ~40 words per slide), relaxed automatically for
  read-alone decks that have no presenter to explain them.
- Speaker notes on every slide, written as the spoken track.
- No invented numbers. Gaps come back as `[NEEDS DATA: ...]` instead of plausible-looking
  fabrications, and projections stay labeled as projections.
- A built file, not an outline, when a file was asked for.
- A kill list of deck anti-patterns: topic titles, agenda slides, "Questions?" closers,
  tool inventories, padding to hit a slide count.
