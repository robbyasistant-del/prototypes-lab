import collections
import datetime
import glob
import html
import json
import os
import re

root = r"C:/Users/robby/.openclaw/workspace/market_intel"
raw = root + "/data/raw"
rpt = root + "/reports/daily_trend_report.html"

SOURCES = [
    ("appbrain", "app_name"),
    ("google_trends", "title"),
    ("reddit", "title"),
]

STOPWORDS = {
    "with", "from", "that", "this", "game", "games", "daily", "para", "como",
    "your", "have", "just", "they", "them", "into", "over", "when", "what",
    "best", "more", "less", "than", "you", "are", "not", "all", "new"
}

TOKEN_RE = re.compile(r"[a-záéíóúñ]{4,}", re.I)


def tokenize(text: str):
    for w in TOKEN_RE.findall((text or "").lower()):
        if w in STOPWORDS:
            continue
        yield w


# Days are driven by appbrain presence (same as existing behavior)
days = sorted({os.path.splitext(os.path.basename(p))[0] for p in glob.glob(raw + "/appbrain/*.jsonl")})

# counts_by_day[day][word] = total occurrences across sources
counts_by_day = {d: collections.Counter() for d in days}
# counts_by_source_total[source][word] = cumulative occurrences in that source across all days
counts_by_source_total = {src: collections.Counter() for src, _ in SOURCES}

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
                text = (o.get(field) or o.get("app_name") or o.get("title") or "")
                for w in tokenize(text):
                    counts_by_day[d][w] += 1
                    counts_by_source_total[src][w] += 1

# Total across all days/sources
total_counts = collections.Counter()
for d in days:
    total_counts.update(counts_by_day[d])

# Top 50 words globally
top_words = [w for w, _ in total_counts.most_common(50)]

# Rank maps for trend calc based on latest two days
latest_day = days[-1] if days else None
prev_day = days[-2] if len(days) > 1 else None
latest_rank = {}
prev_rank = {}
if latest_day:
    latest_rank = {w: i + 1 for i, (w, _) in enumerate(counts_by_day[latest_day].most_common())}
if prev_day:
    prev_rank = {w: i + 1 for i, (w, _) in enumerate(counts_by_day[prev_day].most_common())}


def trend_label(word: str) -> str:
    if not latest_day:
        return "="
    r_now = latest_rank.get(word)
    if r_now is None:
        return "="
    r_prev = prev_rank.get(word)
    if r_prev is None:
        return "↑ new"
    delta = r_prev - r_now
    if delta > 0:
        return f"↑ +{delta}"
    if delta < 0:
        return f"↓ {delta}"
    return "="


header_days = "".join(f"<th>{html.escape(d)}</th>" for d in days)

rows_html = []
for w in top_words:
    per_day = "".join(f"<td>{counts_by_day[d].get(w, 0)}</td>" for d in days)
    rows_html.append(
        "<tr>"
        f"<td>{html.escape(trend_label(w))}</td>"
        f"<td><b>{html.escape(w)}</b></td>"
        f"<td>{total_counts.get(w, 0)}</td>"
        f"<td>{counts_by_source_total['appbrain'].get(w, 0)}</td>"
        f"<td>{counts_by_source_total['google_trends'].get(w, 0)}</td>"
        f"<td>{counts_by_source_total['reddit'].get(w, 0)}</td>"
        f"{per_day}"
        "</tr>"
    )

html_rows = "\n".join(rows_html)
now = datetime.datetime.now().isoformat(timespec="seconds")

out = f"""<!doctype html>
<html>
<head>
<meta charset=\"utf-8\">
<title>Market Intel Daily Trend Report</title>
<style>
body {{font-family: Arial, sans-serif; margin: 20px}}
table {{border-collapse: collapse; width: 100%; font-size: 13px}}
th, td {{border: 1px solid #ddd; padding: 6px; vertical-align: top}}
th {{background: #f3f3f3; position: sticky; top: 0}}
tr:nth-child(even) {{background: #fafafa}}
.note {{color:#444; margin-bottom:10px}}
</style>
</head>
<body>
<h2>Market Intel Daily Trend Report (Top 50 palabras)</h2>
<p>Updated: {now}</p>
<p class=\"note\">Trend = cambio de posición en ranking contra el día previo (usando las dos últimas fechas disponibles).</p>
<table>
<thead>
<tr>
<th>Trend</th><th>Palabra</th><th>Total</th>
<th>Total AppBrain</th><th>Total Google Trends</th><th>Total Reddit</th>
{header_days}
</tr>
</thead>
<tbody>
{html_rows}
</tbody>
</table>
</body>
</html>"""

os.makedirs(os.path.dirname(rpt), exist_ok=True)
with open(rpt, "w", encoding="utf-8") as f:
    f.write(out)

print(rpt)
