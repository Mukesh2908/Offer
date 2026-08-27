'use strict';

/**
 * A hand-written spec used by --demo and by the render tests. It exercises every
 * layout branch, so rendering it is the fastest check that the renderers still
 * agree with the schema. No API key required.
 */
const demoDeck = {
  title: 'Ship the Cache Rewrite This Quarter',
  subtitle: 'A capacity decision, not a cleanup project',
  core_message:
    'The cache layer is now the top source of customer-visible latency, and one quarter of focused work removes it as a risk.',
  palette: 'ocean_gradient',
  palette_rationale:
    'Cool blues read as infrastructure and keep the tone analytical rather than alarmed.',
  slides: [
    {
      layout: 'title',
      title: 'Ship the Cache Rewrite This Quarter',
      subtitle: 'A capacity decision, not a cleanup project',
      notes:
        'Thanks for making time. I want twenty minutes to make the case that the cache rewrite belongs in this quarter rather than next. I am not going to argue it on elegance — I am going to argue it on customer-visible latency and on what it costs us to wait. Let me start with what is actually happening in production.',
    },
    {
      layout: 'stat',
      title: 'Cache misses now drive most of our slow requests',
      stats: [
        { value: '61%', label: 'of p99 latency traced to cache misses', projected: false },
        { value: '4.2s', label: 'worst-case checkout page load', projected: false },
        { value: '38%', label: 'projected p99 improvement after rewrite', projected: true },
      ],
      notes:
        'These first two numbers come from last month of production tracing. Sixty-one percent of our p99 latency now traces back to cache misses, and at the tail a checkout page can take over four seconds. The third number is a projection, not a measurement — it is what the prototype achieved on replayed traffic. I want to be clear about which is which. Next, why this got worse rather than better.',
    },
    {
      layout: 'process',
      title: 'Every read pays for a design made for a smaller catalogue',
      steps: [
        { label: 'Request', detail: 'Hits the edge with no key namespacing' },
        { label: 'Lookup', detail: 'Full-scan across a single flat keyspace' },
        { label: 'Miss', detail: 'Falls through to primary database' },
        { label: 'Refill', detail: 'Rewrites the whole entry, not the delta' },
      ],
      notes:
        'The original cache assumed a catalogue about a tenth of its current size, so it uses one flat keyspace with no namespacing. Every lookup scans it. When we miss, we fall through to the primary and then rewrite the entire entry rather than the part that changed. Each of those four stages is cheap on its own — together they are why the tail is so bad. So what changes if we fix it?',
    },
    {
      layout: 'comparison',
      title: 'The rewrite trades one week of migration for steady tail latency',
      columns: [
        {
          heading: 'Today',
          points: ['Flat keyspace, full scans', 'Whole-entry refills', 'Tail grows with catalogue', 'No per-tenant isolation'],
        },
        {
          heading: 'After',
          points: ['Namespaced keys per tenant', 'Delta refills only', 'Tail flat as catalogue grows', 'Noisy tenants contained'],
        },
      ],
      notes:
        'On the left is what we run today. On the right is what the prototype does. The change that matters most is the last row — today a single heavy tenant degrades everyone, and after the rewrite they are contained. The migration itself is about a week of dual-writing. Let me talk about what could go wrong.',
    },
    {
      layout: 'bullets',
      title: 'Three risks, each with a mitigation we have already tested',
      bullets: [
        { heading: 'Dual-write drift', detail: 'Shadow reads compare both paths for a week' },
        { heading: 'Cold start', detail: 'Warm the cache from replayed production traffic' },
        { heading: 'Rollback', detail: 'Feature flag returns to old path in one deploy' },
      ],
      notes:
        'Three risks worth naming. Drift between the old and new path during dual-writing — we handle that with shadow reads that compare both for a full week before cutover. Cold start on the new cache — we warm it from replayed traffic rather than from live requests. And rollback, which is a single feature flag, not a redeploy. None of these are theoretical; we rehearsed all three in staging. That brings me to what I am asking for.',
    },
    {
      layout: 'closing',
      title: 'Approve one engineer-quarter, starting next sprint',
      bullets: [
        { heading: 'Decision needed', detail: 'By the end of this week to make the sprint' },
        { heading: 'Team', detail: 'Two engineers, six weeks, no new headcount' },
        { heading: 'Checkpoint', detail: 'Shadow-read results reviewed at week three' },
      ],
      notes:
        'What I need is one engineer-quarter — two engineers for six weeks, drawn from the existing team, no new headcount. I need the decision by Friday for it to make the next sprint. We will come back at week three with shadow-read results, and if the comparison looks wrong we stop there rather than cutting over. Happy to take questions.',
    },
  ],
  assumptions: [
    'Audience is engineering leadership familiar with the system at a high level.',
    'Fifteen-minute slot, so six slides rather than ten.',
  ],
  needs_data: [
    'Dollar cost of the current tail latency in lost checkout conversions',
    'Exact headcount availability for the sprint after next',
  ],
};

module.exports = { demoDeck };
