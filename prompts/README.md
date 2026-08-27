# Prompts

Prompts for driving an AI agent that builds slide decks.

| File | What it is |
|---|---|
| [`presentation-agent.md`](presentation-agent.md) | The reusable prompt. **Part A** is the agent's system prompt; **Part B** is the per-deck brief template. |
| [`examples/food-waste-azure-deck.md`](examples/food-waste-azure-deck.md) | A filled-in brief for the Azure food waste project in `P5.pdf`, with the source content embedded so nothing else needs to be attached. |

## How to use

1. Paste **Part A** of `presentation-agent.md` as the system prompt (or drop it in as a
   custom instruction / agent definition).
2. Copy the **Part B** template, fill in audience, purpose, length, format, and paste your
   source material under `SOURCE MATERIAL:`.
3. Send it. With `ONE-PASS: no` the agent stops after the outline so you can redirect
   before it spends effort on slides; with `ONE-PASS: yes` it builds straight through.

For a working example, `examples/food-waste-azure-deck.md` is paste-and-go.

## What the prompt enforces

- A stated core message, and every slide serving it.
- Assertion titles — skimming the titles reproduces the argument.
- Hard limits on slide density (5 bullets / 10 words / ~40 words per slide).
- Speaker notes on every slide.
- No invented numbers. Missing figures come back as `[NEEDS DATA: ...]` rather than
  plausible-looking fabrications.
- A built file, not an outline, when a file was asked for.
