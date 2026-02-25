#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, 'data');
fs.mkdirSync(OUT_DIR, { recursive: true });

const COUNTRIES = ['ES', 'US', 'UK'];
const GAMES = [
  { key: 'arrow-escape-daily', title: 'Arrow Escape Daily', query: 'arrow escape daily puzzle' },
  { key: 'word-solitaire-mix', title: 'Word-Solitaire Mix', query: 'word solitaire' },
  { key: 'block-duel', title: 'Block Duel', query: 'block duel puzzle' },
];

const today = new Date();
const dateStr = today.toISOString().slice(0, 10);

function extractAppIds(html) {
  const ids = [];
  const re = /\/store\/apps\/details\?id=([A-Za-z0-9._-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.push(m[1]);
  return [...new Set(ids)].slice(0, 20);
}

async function fetchSearch(query, country) {
  const url = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps&gl=${country}&hl=en`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();
  return { url, ids: extractAppIds(text) };
}

function findPrevSnapshot() {
  const files = fs.readdirSync(OUT_DIR).filter(f => /^top20-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  if (files.length === 0) return null;
  const prev = files[files.length - 1];
  const prevPath = path.join(OUT_DIR, prev);
  const prevData = JSON.parse(fs.readFileSync(prevPath, 'utf8'));
  if (prevData.date === dateStr && files.length > 1) {
    const prev2Path = path.join(OUT_DIR, files[files.length - 2]);
    return JSON.parse(fs.readFileSync(prev2Path, 'utf8'));
  }
  return prevData.date === dateStr ? null : prevData;
}

function diffRankings(current, previous) {
  if (!previous) return { important: [], summary: 'No previous snapshot to compare.' };
  const important = [];

  for (const game of GAMES) {
    for (const country of COUNTRIES) {
      const key = `${game.key}:${country}`;
      const curr = current.rankings[key]?.top20 || [];
      const prev = previous.rankings[key]?.top20 || [];
      const prevPos = new Map(prev.map((id, i) => [id, i + 1]));
      const currPos = new Map(curr.map((id, i) => [id, i + 1]));

      for (const [id, p] of prevPos) {
        if (!currPos.has(id)) important.push({ type: 'dropped_out', key, appId: id, from: p });
      }
      for (const [id, p] of currPos) {
        if (!prevPos.has(id) && p <= 5) important.push({ type: 'new_top5', key, appId: id, to: p });
      }
      for (const [id, pNow] of currPos) {
        if (!prevPos.has(id)) continue;
        const pPrev = prevPos.get(id);
        const delta = pPrev - pNow;
        if (Math.abs(delta) >= 5) {
          important.push({
            type: delta > 0 ? 'big_rise' : 'big_drop',
            key,
            appId: id,
            from: pPrev,
            to: pNow,
            delta,
          });
        }
      }
    }
  }

  const summary = important.length
    ? `Detected ${important.length} important ranking changes.`
    : 'No important ranking changes detected.';
  return { important, summary };
}

function renderHtml(snapshot, diff) {
  const rows = [];
  for (const game of GAMES) {
    for (const country of COUNTRIES) {
      const key = `${game.key}:${country}`;
      const top = snapshot.rankings[key]?.top20 || [];
      const list = top.map((id, i) => `<li>#${i + 1} <a href="https://play.google.com/store/apps/details?id=${id}">${id}</a></li>`).join('');
      rows.push(`<section class="card"><h3>${game.title} — ${country}</h3><p>Query: <code>${snapshot.rankings[key]?.query || ''}</code></p><ol>${list || '<li>No results parsed</li>'}</ol></section>`);
    }
  }

  const changes = diff.important.length
    ? `<ul>${diff.important.map(c => `<li><b>${c.type}</b> — ${c.key} — ${c.appId} ${c.from ? `(from #${c.from})` : ''} ${c.to ? `(to #${c.to})` : ''}</li>`).join('')}</ul>`
    : '<p>No important changes vs previous snapshot.</p>';

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Top20 by country ${snapshot.date}</title><style>body{font-family:Arial;background:#0f1220;color:#eef2ff;padding:20px}main{max-width:1000px;margin:auto}.card{background:#1a2140;border:1px solid #32447a;border-radius:10px;padding:12px;margin:10px 0}a{color:#9ec0ff}code{background:#121a35;padding:2px 6px;border-radius:6px}</style></head><body><main><h1>Top20 Google Play by country — ${snapshot.date}</h1><div class="card"><h2>Important changes vs previous day</h2>${changes}</div>${rows.join('')}</main></body></html>`;
}

(async () => {
  const rankings = {};
  for (const game of GAMES) {
    for (const country of COUNTRIES) {
      const key = `${game.key}:${country}`;
      try {
        const r = await fetchSearch(game.query, country);
        rankings[key] = { query: game.query, country, top20: r.ids, source: r.url };
      } catch (e) {
        rankings[key] = { query: game.query, country, top20: [], error: String(e) };
      }
    }
  }

  const snapshot = { date: dateStr, rankings };
  const prev = findPrevSnapshot();
  const diff = diffRankings(snapshot, prev);

  fs.writeFileSync(path.join(OUT_DIR, `top20-${dateStr}.json`), JSON.stringify(snapshot, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, `changes-${dateStr}.json`), JSON.stringify(diff, null, 2));

  const html = renderHtml(snapshot, diff);
  fs.writeFileSync(path.resolve(__dirname, `top20-${dateStr}.html`), html);
  fs.writeFileSync(path.resolve(__dirname, 'top20-latest.html'), html);

  const alertText = diff.important.length
    ? `[TOP20 ALERT ${dateStr}] ${diff.summary}\n` + diff.important.slice(0, 20).map(c => `- ${c.type} ${c.key} ${c.appId} ${c.from ? `#${c.from}` : ''}${c.to ? ` -> #${c.to}` : ''}`).join('\n')
    : `[TOP20 OK ${dateStr}] ${diff.summary}`;
  fs.writeFileSync(path.join(OUT_DIR, `alert-${dateStr}.txt`), alertText + '\n');

  console.log(alertText);
})();