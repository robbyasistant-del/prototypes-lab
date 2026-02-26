#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, 'data');
fs.mkdirSync(OUT_DIR, { recursive: true });

const COUNTRY_GROUPS = {
  ES: ['ES'],
  US: ['US'],
  UK: ['GB'],
  MX: ['MX'],
  LATAM: ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'],
  ANGLOSAXON: ['US', 'GB', 'IE', 'CA', 'AU', 'NZ'],
  EUROPEAN: ['ES', 'PT', 'FR', 'DE', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'RO', 'GR'],
  ASIA: ['JP', 'KR', 'IN', 'ID', 'TH', 'PH', 'MY', 'SG', 'VN', 'TW', 'HK'],
};

const QUERIES = {
  puzzle: [
    'daily puzzle game',
    'puzzle challenge',
    'logic puzzle daily',
    'brain teaser puzzle',
  ],
  word: [
    'daily word game',
    'crossword puzzle',
    'riddle word game',
    'word puzzle casual',
  ],
  casual: [
    'casual puzzle game',
    'hypercasual puzzle',
    'quick daily game',
    'relaxing puzzle casual',
  ],
};

const today = new Date();
const dateStr = today.toISOString().slice(0, 10);

function extractAppIds(html) {
  const ids = [];
  const re = /\/store\/apps\/details\?id=([A-Za-z0-9._-]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.push(m[1]);
  return [...new Set(ids)];
}

async function fetchSearch(query, country) {
  const url = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps&gl=${country}&hl=en`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const text = await res.text();
  return { url, ids: extractAppIds(text) };
}

function scoreIds(resultIds, scoreMap) {
  resultIds.slice(0, 40).forEach((id, idx) => {
    const pos = idx + 1;
    const score = Math.max(1, 50 - pos); // higher rank => higher score
    scoreMap.set(id, (scoreMap.get(id) || 0) + score);
  });
}

function normalizeTop20(scoreMap) {
  return [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([appId, score]) => ({ appId, score }));
}

function previousSnapshot() {
  const files = fs.readdirSync(OUT_DIR)
    .filter(f => /^top20-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length) return null;
  let idx = files.length - 1;
  let selected = files[idx];
  const currentFile = `top20-${dateStr}.json`;
  if (selected === currentFile && idx > 0) selected = files[idx - 1];
  if (selected === currentFile) return null;
  return JSON.parse(fs.readFileSync(path.join(OUT_DIR, selected), 'utf8'));
}

function diffRankings(current, previous) {
  if (!previous) return { summary: 'No previous snapshot to compare.', important: [] };
  const important = [];
  for (const group of Object.keys(COUNTRY_GROUPS)) {
    const curr = current.rankings[group]?.top20 || [];
    const prev = previous.rankings[group]?.top20 || [];
    const currPos = new Map(curr.map((x, i) => [x.appId, i + 1]));
    const prevPos = new Map(prev.map((x, i) => [x.appId, i + 1]));

    for (const [appId, pPrev] of prevPos) {
      if (!currPos.has(appId)) important.push({ type: 'dropped_out', group, appId, from: pPrev });
    }
    for (const [appId, pNow] of currPos) {
      if (!prevPos.has(appId) && pNow <= 5) important.push({ type: 'new_top5', group, appId, to: pNow });
      if (!prevPos.has(appId)) continue;
      const pPrev = prevPos.get(appId);
      const delta = pPrev - pNow;
      if (Math.abs(delta) >= 5) {
        important.push({ type: delta > 0 ? 'big_rise' : 'big_drop', group, appId, from: pPrev, to: pNow, delta });
      }
    }
  }
  return {
    summary: important.length ? `Detected ${important.length} important ranking changes.` : 'No important ranking changes detected.',
    important,
  };
}

function renderHtml(snapshot, diff) {
  const blocks = Object.keys(COUNTRY_GROUPS).map(group => {
    const item = snapshot.rankings[group];
    const rows = (item.top20 || []).map((x, i) =>
      `<tr><td>#${i + 1}</td><td><a href="https://play.google.com/store/apps/details?id=${x.appId}">${x.appId}</a></td><td>${x.score}</td></tr>`).join('');
    return `<section class="card"><h2>${group}</h2><p><b>Countries:</b> ${item.countries.join(', ')}</p><p><b>Queries:</b> ${item.queryCount} (${Object.keys(QUERIES).join(', ')})</p><table><thead><tr><th>Rank</th><th>App</th><th>Score</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No data</td></tr>'}</tbody></table></section>`;
  }).join('');

  const changes = diff.important.length
    ? `<ul>${diff.important.slice(0, 100).map(c => `<li><b>${c.type}</b> — ${c.group} — ${c.appId} ${c.from ? `#${c.from}` : ''}${c.to ? ` → #${c.to}` : ''}</li>`).join('')}</ul>`
    : '<p>No important changes vs previous snapshot.</p>';

  const movers = diff.important
    .filter(c => c.type === 'big_rise' || c.type === 'big_drop')
    .sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0))
    .slice(0, 20);

  const moversBlock = movers.length
    ? `<ul>${movers.map(m => `<li><b>${m.group}</b> — <a href="https://play.google.com/store/apps/details?id=${m.appId}">${m.appId}</a> ${m.type === 'big_rise' ? '⬆️' : '⬇️'} ${m.from ? `#${m.from}` : ''}${m.to ? ` → #${m.to}` : ''} (${m.delta > 0 ? '+' : ''}${m.delta})</li>`).join('')}</ul>`
    : '<p>No movers yet (need at least one previous snapshot).</p>';

  const newEntries = diff.important
    .filter(c => c.type === 'new_top5' || c.type === 'dropped_out')
    .slice(0, 30);

  const newEntriesBlock = newEntries.length
    ? `<ul>${newEntries.map(n => `<li><b>${n.group}</b> — <a href="https://play.google.com/store/apps/details?id=${n.appId}">${n.appId}</a> ${n.type === 'new_top5' ? `🆕 entered Top5 at #${n.to}` : `🚪 dropped out from #${n.from}`}</li>`).join('')}</ul>`
    : '<p>No new entries / dropouts yet (need at least one previous snapshot).</p>';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Top20 blended ${snapshot.date}</title><style>body{font-family:Arial;background:#0f1220;color:#eef2ff;padding:20px}main{max-width:1100px;margin:auto}.card{background:#1a2140;border:1px solid #32447a;border-radius:10px;padding:12px;margin:12px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #34477f;padding:7px;text-align:left}a{color:#a9c4ff}</style></head><body><main><h1>Top20 Google Play (blended by keywords + categories) — ${snapshot.date}</h1><div class="card"><h2>Important changes vs previous day</h2><p>${diff.summary}</p>${changes}</div><div class="card"><h2>Top movers del día (subidas/caídas)</h2>${moversBlock}</div><div class="card"><h2>Apps nuevas y salidas del Top20/Top5</h2>${newEntriesBlock}</div>${blocks}</main></body></html>`;
}

(async () => {
  const rankings = {};
  const allQueries = Object.values(QUERIES).flat();

  for (const [group, countries] of Object.entries(COUNTRY_GROUPS)) {
    const scoreMap = new Map();
    const debug = [];

    for (const country of countries) {
      for (const query of allQueries) {
        try {
          const res = await fetchSearch(query, country);
          scoreIds(res.ids, scoreMap);
          debug.push({ country, query, source: res.url, found: res.ids.length });
        } catch (e) {
          debug.push({ country, query, error: String(e) });
        }
      }
    }

    rankings[group] = {
      countries,
      queryCount: countries.length * allQueries.length,
      top20: normalizeTop20(scoreMap),
      debug,
    };
  }

  const snapshot = { date: dateStr, rankings, queries: QUERIES };
  const prev = previousSnapshot();
  const diff = diffRankings(snapshot, prev);

  const jsonPath = path.join(OUT_DIR, `top20-${dateStr}.json`);
  const diffPath = path.join(OUT_DIR, `changes-${dateStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2));
  fs.writeFileSync(diffPath, JSON.stringify(diff, null, 2));

  const html = renderHtml(snapshot, diff);
  fs.writeFileSync(path.resolve(__dirname, `top20-${dateStr}.html`), html);
  fs.writeFileSync(path.resolve(__dirname, 'top20-latest.html'), html);

  const alertText = diff.important.length
    ? `[TOP20 ALERT ${dateStr}] ${diff.summary}\n` + diff.important.slice(0, 30).map(c => `- ${c.type} ${c.group} ${c.appId} ${c.from ? `#${c.from}` : ''}${c.to ? ` -> #${c.to}` : ''}`).join('\n')
    : `[TOP20 OK ${dateStr}] ${diff.summary}`;
  fs.writeFileSync(path.join(OUT_DIR, `alert-${dateStr}.txt`), alertText + '\n');

  console.log(alertText);
})();