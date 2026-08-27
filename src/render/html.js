'use strict';

const { getPalette, FONTS } = require('../theme');

/**
 * DeckSpec -> a single self-contained HTML file.
 *
 * Same layouts and palette as the .pptx so the browser preview is a faithful
 * proxy for the file people download. Slides are 16:9 boxes scaled to the
 * viewport; arrow keys and click advance.
 */

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const DARK = new Set(['title', 'section', 'quote', 'closing']);

function slideBody(s, deck, index) {
  switch (s.layout) {
    case 'title':
      return `<h1 class="deck-title">${esc(s.title || deck.title)}</h1>
        <p class="deck-sub">${esc(s.subtitle || deck.subtitle)}</p>`;

    case 'section':
      return `<div class="sec-num">${String(index + 1).padStart(2, '0')}</div>
        <h2 class="sec-title">${esc(s.title)}</h2>`;

    case 'quote':
      return `<blockquote>“${esc(s.quote || s.title)}”</blockquote>
        ${s.attribution ? `<p class="attrib">${esc(s.attribution)}</p>` : ''}`;

    case 'closing':
      return `<h2 class="sec-title">${esc(s.title)}</h2>
        ${(s.bullets || []).length
          ? `<ul class="closing-list">${(s.bullets || [])
              .map((b) => `<li><strong>${esc(b.heading)}</strong> — ${esc(b.detail)}</li>`)
              .join('')}</ul>`
          : `<p class="core">${esc(deck.core_message)}</p>`}`;

    case 'stat':
      return `<h2>${esc(s.title)}</h2>
        <div class="band stats">${(s.stats || [])
          .map((st) => `<div class="card stat">
            <div class="stat-value">${esc(st.value)}</div>
            <div class="stat-label">${esc(st.label)}</div>
            ${st.projected ? '<div class="proj">projected, not measured</div>' : ''}
          </div>`).join('')}</div>`;

    case 'two_column':
    case 'comparison':
      return `<h2>${esc(s.title)}</h2>
        <div class="band cols">${(s.columns || [])
          .map((c, i) => `<div class="card ${s.layout === 'comparison' && i === 1 ? 'accented' : ''}">
            <div class="card-head"><span class="badge">${i + 1}</span>${esc(c.heading)}</div>
            <ul>${(c.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>`).join('')}</div>`;

    case 'process':
      return `<h2>${esc(s.title)}</h2>
        <div class="band steps">${(s.steps || [])
          .map((st, i, arr) => `<div class="step">
            <div class="chev" style="opacity:${0.42 + (i / Math.max(arr.length - 1, 1)) * 0.58}">${esc(st.label)}</div>
            <div class="step-detail">${esc(st.detail)}</div>
          </div>`).join('')}</div>`;

    case 'bullets':
    default:
      return `<h2>${esc(s.title)}</h2>
        <div class="band rows">${(s.bullets || [])
          .map((b, i) => `<div class="row">
            <span class="badge">${i + 1}</span>
            <span class="row-head">${esc(b.heading)}</span>
            <span class="row-detail">${esc(b.detail)}</span>
          </div>`).join('')}</div>`;
  }
}

function renderHtml(deck) {
  const p = getPalette(deck.palette);
  const slides = deck.slides.map((s, i) => `
    <section class="slide ${DARK.has(s.layout) ? 'dark' : 'light'}" data-i="${i}">
      ${DARK.has(s.layout) ? '<div class="motif"></div>' : ''}
      ${slideBody(s, deck, i)}
      ${DARK.has(s.layout) ? '' : `<div class="pageno">${i + 1}</div>`}
    </section>`).join('');

  return `<title>${esc(deck.title)}</title>
<style>
  :root{
    --dark:#${p.dark}; --light:#${p.light}; --tint:#${p.tint}; --accent:#${p.accent};
    --accent-light:#${p.accentLight}; --on-dark:#${p.onDark}; --on-light:#${p.onLight};
    --muted:#${p.muted}; --head:${FONTS.heading},Georgia,serif; --body:${FONTS.body},system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:#0e1116;font-family:var(--body);display:flex;
    align-items:center;justify-content:center;min-height:100vh;padding:16px}
  .stage{width:min(100%,1100px);aspect-ratio:16/9;position:relative;
    box-shadow:0 12px 48px rgba(0,0,0,.5);border-radius:6px;overflow:hidden}
  .slide{position:absolute;inset:0;padding:5.2% 5.6%;display:none;flex-direction:column;
    container-type:inline-size}
  .slide.on{display:flex}
  .slide.light{background:var(--light);color:var(--on-light)}
  .slide.dark{background:var(--dark);color:var(--on-dark);justify-content:center}
  .motif{position:absolute;width:33%;aspect-ratio:1;border-radius:50%;
    background:var(--accent);opacity:.18;right:-6%;top:-20%}
  h1,h2,.sec-title{font-family:var(--head);font-weight:700;margin:0;position:relative}
  h2{font-size:4.1cqw;line-height:1.18;letter-spacing:-.01em}
  .deck-title{font-size:5.6cqw;line-height:1.14;max-width:78%}
  .deck-sub{font-size:2.3cqw;color:var(--accent-light);margin:2.2cqw 0 0;max-width:70%;position:relative}
  .sec-num{font-size:2.4cqw;font-weight:700;color:var(--accent-light);
    font-family:var(--body);margin-bottom:1cqw;position:relative}
  .sec-title{font-size:4.6cqw;max-width:76%}
  blockquote{font-family:var(--head);font-style:italic;font-size:3.5cqw;line-height:1.35;
    margin:0;max-width:76%;position:relative}
  .attrib{color:var(--accent-light);font-size:1.7cqw;margin:2.4cqw 0 0;position:relative}
  .core{color:var(--accent-light);font-size:2.2cqw;max-width:72%;margin:3cqw 0 0;position:relative}
  .closing-list{margin:3cqw 0 0;padding-left:2.2cqw;font-size:2cqw;line-height:2;
    max-width:76%;position:relative}
  .band{flex:1;display:flex;margin-top:3.4cqw;min-height:0}
  .stats,.cols{gap:2.6%}
  .card{flex:1;background:var(--tint);border-radius:8px;padding:3cqw 2.6cqw;min-width:0}
  .card.accented{background:color-mix(in srgb,var(--accent) 24%,#fff)}
  .stat{display:flex;flex-direction:column;justify-content:center}
  .stat-value{font-family:var(--head);font-weight:700;font-size:8cqw;color:var(--accent);line-height:1}
  .stat-label{font-size:1.75cqw;margin-top:2.4cqw;line-height:1.4}
  .proj{font-size:1.35cqw;font-style:italic;color:var(--muted);margin-top:1.6cqw}
  .card-head{display:flex;align-items:center;gap:1.2cqw;font-weight:700;font-size:2.2cqw;
    margin-bottom:1.8cqw}
  .card ul{margin:0;padding-left:2cqw;font-size:1.8cqw;line-height:1.95}
  .badge{display:inline-flex;align-items:center;justify-content:center;flex:none;
    width:2.9cqw;height:2.9cqw;border-radius:50%;background:var(--accent);color:#fff;
    font-size:1.35cqw;font-weight:700}
  .rows{flex-direction:column;justify-content:space-around}
  .row{display:flex;align-items:center;gap:1.6cqw}
  .row-head{font-weight:700;font-size:2.2cqw;flex:0 0 26%}
  .row-detail{color:var(--muted);font-size:1.9cqw}
  .steps{gap:1.4%;align-items:flex-start;padding-top:2cqw}
  .step{flex:1;min-width:0}
  .chev{background:var(--accent);color:var(--on-light);font-weight:700;font-size:1.85cqw;
    text-align:center;padding:2.4cqw .6cqw;
    clip-path:polygon(0 0,88% 0,100% 50%,88% 100%,0 100%,12% 50%)}
  .step-detail{color:var(--muted);font-size:1.55cqw;text-align:center;margin-top:1.4cqw;line-height:1.45}
  .pageno{position:absolute;right:4%;bottom:3.4%;color:var(--muted);font-size:1.3cqw}
  .hud{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);color:#8b94a3;
    font:500 13px var(--body);letter-spacing:.02em}
</style>
<div class="stage">${slides}</div>
<div class="hud"><span id="n">1</span> / ${deck.slides.length} &nbsp;·&nbsp; arrow keys to navigate</div>
<script>
  var slides = document.querySelectorAll('.slide'), i = 0;
  function show(n){
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function(s, k){ s.classList.toggle('on', k === i); });
    document.getElementById('n').textContent = i + 1;
  }
  addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { show(i + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { show(i - 1); e.preventDefault(); }
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(slides.length - 1);
  });
  document.querySelector('.stage').addEventListener('click', function(){ show(i + 1); });
  show(0);
</script>`;
}

module.exports = { renderHtml };
