import datetime
import glob
import html
import json
import os
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher

root = r"C:/Users/robby/.openclaw/workspace/market_intel"
raw = root + "/data/raw"
rpt = root + "/reports/daily_trend_report.html"

SOURCES = [
    ("appbrain", "app_name"),
    ("google_trends", "title"),
    ("reddit", "title"),
    ("play_store", "app_name"),
    ("x_trends", "title"),
]

SOURCE_WEIGHTS = {
    "appbrain": 0.35,
    "play_store": 0.25,
    "google_trends": 0.20,
    "x_trends": 0.12,
    "reddit": 0.08,
}

# Curated dictionary: canonical single-word keywords
CORE_WORDS = [
    "puzzle", "word", "wordle", "connections", "crossword", "sudoku", "anagram",
    "scramble", "guess", "quiz", "trivia", "solitaire", "mahjong", "block",
    "tile", "match", "brain", "logic", "letters", "spelling", "daily", "mini",
    "search", "riddle", "clues",
]

ADJ_WORDS = [
    "streak", "leaderboard", "ranking", "challenge", "multiplayer", "duel", "versus",
    "pvp", "share", "referral", "invite", "reward", "coins", "booster", "offline",
    "relax", "cozy", "speed", "timed", "score", "levels", "season", "event",
    "viral", "trend",
]

KEYWORDS = [(w, "core") for w in CORE_WORDS] + [(w, "adjacency") for w in ADJ_WORDS]
KEYWORD_META = {k: t for k, t in KEYWORDS}

# Fuzzy/contains alias map so close forms collapse into the same canonical token.
# Example: "connection", "connect", "connected" -> "connections"
ALIASES = {
    "puzzle": ["puzzl"],
    "word": ["word"],
    "wordle": ["wordle"],
    "connections": ["connection", "connect", "nytconnection", "sportsconnection"],
    "crossword": ["crossword", "crosswords"],
    "sudoku": ["sudoku"],
    "anagram": ["anagram"],
    "scramble": ["scrambl"],
    "guess": ["guess", "guesser"],
    "quiz": ["quiz", "quizz"],
    "trivia": ["trivia"],
    "solitaire": ["solitair"],
    "mahjong": ["mahjong"],
    "block": ["block"],
    "tile": ["tile", "tiles"],
    "match": ["match"],
    "brain": ["brain"],
    "logic": ["logic", "logical"],
    "letters": ["letter", "letters"],
    "spelling": ["spell", "spelling"],
    "daily": ["daily", "dayli"],
    "mini": ["mini"],
    "search": ["search"],
    "riddle": ["riddle", "riddl"],
    "clues": ["clue", "clues"],

    "streak": ["streak"],
    "leaderboard": ["leaderboard", "leader"],
    "ranking": ["rank", "ranking"],
    "challenge": ["challenge", "challeng"],
    "multiplayer": ["multiplayer", "multi"],
    "duel": ["duel"],
    "versus": ["versus", "vs"],
    "pvp": ["pvp"],
    "share": ["share", "sharing", "shared"],
    "referral": ["referral", "refer"],
    "invite": ["invite", "invit"],
    "reward": ["reward", "rewards"],
    "coins": ["coin", "coins"],
    "booster": ["booster", "boost"],
    "offline": ["offline"],
    "relax": ["relax", "relaxed"],
    "cozy": ["cozy", "cosy"],
    "speed": ["speed", "speedy"],
    "timed": ["timed", "timer"],
    "score": ["score", "scoring"],
    "levels": ["level", "levels"],
    "season": ["season", "seasonal"],
    "event": ["event", "events"],
    "viral": ["viral", "virality"],
    "trend": ["trend", "trending", "trends"],
}

TOKEN_RE = re.compile(r"[a-záéíóúñ]{3,}", re.I)


def normalize_token(tok: str) -> str:
    t = (tok or "").lower().strip()
    # remove common endings for lightweight stemming
    for suf in ("ing", "ed", "es", "s", "ly"):
        if len(t) > 5 and t.endswith(suf):
            t = t[: -len(suf)]
            break
    return t


def map_token_to_keyword(tok: str):
    t = normalize_token(tok)

    # 1) direct exact canonical
    if t in KEYWORD_META:
        return t

    # 2) alias contains/prefix checks
    for canonical, aliases in ALIASES.items():
        for a in aliases:
            if t == a or t.startswith(a) or a in t:
                return canonical

    # 3) fuzzy near-match (one-letter-ish differences)
    best_kw = None
    best_score = 0.0
    for kw in KEYWORD_META.keys():
        sc = SequenceMatcher(None, t, kw).ratio()
        if sc > best_score:
            best_score = sc
            best_kw = kw
    if best_kw and best_score >= 0.86 and abs(len(t) - len(best_kw)) <= 2:
        return best_kw

    return None


def fmt_ratio(x: float) -> str:
    return f"{x * 100:.1f}%"


def fmt_delta(today: int, yday: int) -> str:
    d = today - yday
    if d > 0:
        return f"+{d}"
    return str(d)


def signal_label(today: int, yday: int, ratio_today: float) -> str:
    delta = today - yday
    pct = ((today - yday) / yday) if yday > 0 else (1.0 if today > 0 else 0.0)

    if delta >= 2 or pct >= 0.25:
        return "sube"
    if delta <= -2 or pct <= -0.25:
        return "baja"
    if ratio_today < 0.01 and today <= 1:
        return "ruido"
    return "ruido"


# Discover days by appbrain files (same convention)
days = sorted({os.path.splitext(os.path.basename(p))[0] for p in glob.glob(raw + "/appbrain/*.jsonl")})
latest_day = days[-1] if days else None
prev_day = days[-2] if len(days) > 1 else None

# hits[day][source][keyword] = count
hits = defaultdict(lambda: defaultdict(Counter))
# unmapped tokens for dictionary growth
unmapped = defaultdict(lambda: defaultdict(Counter))
# daily_total_hits[day] = total curated keyword hits across all keywords/sources
# (used for ratio normalization)
daily_total_hits = Counter()

for d in days:
    for src, field in SOURCES:
        fp = f"{raw}/{src}/{d}.jsonl"
        if not os.path.exists(fp):
            continue
        with open(fp, encoding="utf-8") as f:
            for ln in f:
                if not ln.strip():
                    continue
                try:
                    o = json.loads(ln)
                except Exception:
                    continue
                text = (o.get(field) or o.get("app_name") or o.get("title") or "").lower()
                for tok in TOKEN_RE.findall(text):
                    mapped = map_token_to_keyword(tok)
                    if mapped:
                        hits[d][src][mapped] += 1
                        daily_total_hits[d] += 1
                    else:
                        nt = normalize_token(tok)
                        if len(nt) >= 4:
                            unmapped[d][src][nt] += 1

# Build per-keyword metrics for latest day
rows = []
for kw, segment in KEYWORDS:
    today_total = sum(hits[latest_day][s].get(kw, 0) for s, _ in SOURCES) if latest_day else 0
    yday_total = sum(hits[prev_day][s].get(kw, 0) for s, _ in SOURCES) if prev_day else 0

    by_src_today = {s: (hits[latest_day][s].get(kw, 0) if latest_day else 0) for s, _ in SOURCES}

    weighted = sum(by_src_today[s] * SOURCE_WEIGHTS[s] for s in by_src_today)
    ratio_today = (today_total / daily_total_hits[latest_day]) if latest_day and daily_total_hits[latest_day] else 0.0

    rows.append({
        "keyword": kw,
        "segment": segment,
        "today": today_total,
        "yday": yday_total,
        "delta": today_total - yday_total,
        "ratio_today": ratio_today,
        "appbrain": by_src_today["appbrain"],
        "play_store": by_src_today["play_store"],
        "google_trends": by_src_today["google_trends"],
        "x_trends": by_src_today["x_trends"],
        "reddit": by_src_today["reddit"],
        "weighted_score": weighted,
        "signal": signal_label(today_total, yday_total, ratio_today),
        "per_day": {d: sum(hits[d][s].get(kw, 0) for s, _ in SOURCES) for d in days},
    })

# top50 requested
rows = sorted(rows, key=lambda r: (r["weighted_score"], r["today"], r["delta"]), reverse=True)[:50]

# Rank movement vs yesterday (within curated dictionary ranking)
rank_today = {r["keyword"]: i + 1 for i, r in enumerate(sorted(rows, key=lambda x: (x["today"], x["weighted_score"]), reverse=True))}
rank_yday_order = sorted(rows, key=lambda x: x["yday"], reverse=True)
rank_yday = {r["keyword"]: i + 1 for i, r in enumerate(rank_yday_order)}


def trend_cell(kw: str) -> str:
    rt = rank_today.get(kw)
    ry = rank_yday.get(kw)
    if rt is None or ry is None:
        return "="
    delta_pos = ry - rt
    if delta_pos > 0:
        return f"↑ +{delta_pos}"
    if delta_pos < 0:
        return f"↓ {delta_pos}"
    return "="


suben = [r for r in rows if r["signal"] == "sube"]
bajan = [r for r in rows if r["signal"] == "baja"]
ruido = [r for r in rows if r["signal"] == "ruido"]

suben = sorted(suben, key=lambda r: (r["delta"], r["weighted_score"]), reverse=True)[:8]
bajan = sorted(bajan, key=lambda r: (r["delta"], -r["weighted_score"]))[:8]
ruido = sorted(ruido, key=lambda r: (r["today"], r["weighted_score"]))[:8]

header_days = "".join(f"<th>{html.escape(d)}</th>" for d in days)

trs = []
for r in rows:
    trend = trend_cell(r["keyword"])
    signal_cls = "up" if r["signal"] == "sube" else ("down" if r["signal"] == "baja" else "noise")
    segment_badge = "core" if r["segment"] == "core" else "adj"
    day_cells = "".join(f"<td>{r['per_day'].get(d, 0)}</td>" for d in days)

    trs.append(
        "<tr>"
        f"<td>{html.escape(trend)}</td>"
        f"<td><b>{html.escape(r['keyword'])}</b> <span class='badge {segment_badge}'>{html.escape(r['segment'])}</span></td>"
        f"<td>{r['today']}</td>"
        f"<td>{fmt_ratio(r['ratio_today'])}</td>"
        f"<td>{fmt_delta(r['today'], r['yday'])}</td>"
        f"<td>{r['appbrain']}</td>"
        f"<td>{r['play_store']}</td>"
        f"<td>{r['google_trends']}</td>"
        f"<td>{r['x_trends']}</td>"
        f"<td>{r['reddit']}</td>"
        f"<td>{r['weighted_score']:.2f}</td>"
        f"<td><span class='sig {signal_cls}'>{html.escape(r['signal'])}</span></td>"
        f"{day_cells}"
        "</tr>"
    )

rows_html = "\n".join(trs)


def chips(items):
    if not items:
        return "<span class='chip'>—</span>"
    out = []
    for r in items:
        out.append(f"<span class='chip'>{html.escape(r['keyword'])} ({fmt_delta(r['today'], r['yday'])})</span>")
    return "".join(out)


def unmapped_chips(day, topn=20):
    if not day:
        return "<span class='chip'>—</span>"
    acc = Counter()
    for s, _ in SOURCES:
        acc.update(unmapped[day][s])
    items = [x for x in acc.most_common(topn) if x[1] >= 2]
    if not items:
        return "<span class='chip'>No hay términos no mapeados relevantes</span>"
    return "".join([f"<span class='chip'>{html.escape(k)} ({v})</span>" for k, v in items])


now = datetime.datetime.now().isoformat(timespec="seconds")

out = f"""<!doctype html>
<html>
<head>
<meta charset=\"utf-8\">
<title>Market Intel Daily Trend Report</title>
<style>
body {{font-family: Inter, Arial, sans-serif; margin: 18px; color:#111827; background:#f7f9fc}}
.panel {{background:#fff; border:1px solid #dbe3f0; border-radius:12px; padding:12px; margin-bottom:12px}}
.h {{display:flex; justify-content:space-between; align-items:flex-end; gap:10px; margin-bottom:8px}}
.sub {{color:#4b5563; font-size:12px}}
.metrics {{display:grid; grid-template-columns:repeat(4,minmax(140px,1fr)); gap:8px}}
.kpi {{background:#f9fbff; border:1px solid #d8e3fb; border-radius:10px; padding:8px}}
.kpi b {{font-size:16px}}

table {{border-collapse: collapse; width: 100%; font-size: 12px; background:#fff; border:1px solid #dbe3f0}}
th, td {{border: 1px solid #e5ebf5; padding: 6px; vertical-align: top}}
th {{background: #f3f6fb; position: sticky; top: 0; z-index: 1}}
tr:nth-child(even) {{background: #fbfdff}}

.badge {{font-size:10px; border-radius:999px; padding:1px 6px; margin-left:6px; border:1px solid}}
.badge.core {{background:#ecfeff; color:#0f766e; border-color:#99f6e4}}
.badge.adj {{background:#fefce8; color:#a16207; border-color:#fde68a}}

.sig {{font-size:11px; font-weight:700; border-radius:999px; padding:2px 8px}}
.sig.up {{background:#dcfce7; color:#166534}}
.sig.down {{background:#fee2e2; color:#991b1b}}
.sig.noise {{background:#e5e7eb; color:#374151}}

.chip {{display:inline-block; margin:2px; font-size:11px; padding:2px 8px; border-radius:999px; border:1px solid #d6deee; background:#f8fbff}}
@media (max-width:960px) {{ .metrics {{grid-template-columns:repeat(2,minmax(140px,1fr));}} }}
</style>
</head>
<body>
  <div class=\"panel\">
    <div class=\"h\">
      <div>
        <h2 style=\"margin:0\">Market Intel Daily Trend Report — Business Mode</h2>
        <div class=\"sub\">Updated: {now} · Diccionario ampliado (core + adjacency) + fuzzy/contains · Top 50</div>
      </div>
      <div class=\"sub\">Último día: {html.escape(str(latest_day or '—'))} · Ayer: {html.escape(str(prev_day or '—'))}</div>
    </div>
    <div class=\"metrics\">
      <div class=\"kpi\"><div class=\"sub\">Keywords monitorizadas</div><b>{len(KEYWORDS)}</b></div>
      <div class=\"kpi\"><div class=\"sub\">Hits hoy (curated)</div><b>{daily_total_hits.get(latest_day, 0) if latest_day else 0}</b></div>
      <div class=\"kpi\"><div class=\"sub\">Suben</div><b>{len(suben)}</b></div>
      <div class=\"kpi\"><div class=\"sub\">Bajan</div><b>{len(bajan)}</b></div>
    </div>
  </div>

  <div class=\"panel\">
    <div class=\"sub\"><b>Suben</b> {chips(suben)}</div>
    <div class=\"sub\" style=\"margin-top:4px\"><b>Bajan</b> {chips(bajan)}</div>
    <div class=\"sub\" style=\"margin-top:4px\"><b>Ruido</b> {chips(ruido)}</div>
  </div>

  <div class=\"panel\">
    <div class=\"sub\"><b>Keywords no mapeadas (para ampliar diccionario)</b></div>
    <div class=\"sub\" style=\"margin-top:4px\">{unmapped_chips(latest_day, 24)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Trend</th>
        <th>Keyword</th>
        <th>Count</th>
        <th>Ratio</th>
        <th>Delta vs ayer</th>
        <th>Total AppBrain</th>
        <th>Total Google Play</th>
        <th>Total Trends</th>
        <th>Total X trends</th>
        <th>Total Reddit</th>
        <th>Score ponderado</th>
        <th>Signal</th>
        {header_days}
      </tr>
    </thead>
    <tbody>
      {rows_html}
    </tbody>
  </table>
</body>
</html>"""

os.makedirs(os.path.dirname(rpt), exist_ok=True)
with open(rpt, "w", encoding="utf-8") as f:
    f.write(out)

print(rpt)
