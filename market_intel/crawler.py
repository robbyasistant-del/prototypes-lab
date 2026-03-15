import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html import escape
from pathlib import Path

BASE = Path(r"C:\Users\robby\.openclaw\workspace\market_intel\data")

SUBREDDITS = [
    "puzzlegames", "wordle", "androidgaming", "gamedev", "boardgames", "indiegaming"
]
TREND_GEOS = ["US", "GB", "ES", "MX"]
APPBRAIN_URLS = [
    "https://www.appbrain.com/stats/google-play-rankings/top_free/game/us",
    "https://www.appbrain.com/stats/google-play-rankings/top_free/game/united-kingdom",
    "https://www.appbrain.com/stats/google-play-rankings/top_free/game/spain",
    "https://www.appbrain.com/stats/google-play-rankings/top_free/game/mexico",
]
PLAY_STORE_TOP_URLS = [
    "https://play.google.com/store/apps/collection/topselling_free?hl=en&gl=us",
    "https://play.google.com/store/apps/collection/topgrossing?hl=en&gl=us",
    "https://play.google.com/store/apps/category/GAME_PUZZLE?hl=en&gl=us",
]
X_TRENDS24_URLS = [
    "https://trends24.in/united-states/",
    "https://trends24.in/united-kingdom/",
    "https://trends24.in/spain/",
    "https://trends24.in/mexico/",
]

STOPWORDS = {
    "with", "from", "that", "this", "game", "games", "puzzle", "daily", "para", "como",
    "your", "have", "just", "about", "into", "will", "what", "when", "where", "they", "them",
}
PUZZLE_WORD_SIGNALS = {
    "wordle", "words", "crossword", "crosswords", "scrabble", "spelling", "anagram", "anagrams",
    "sudoku", "cryptic", "letters", "vocabulary", "guess", "trivia", "brain", "logic", "tiles",
    "riddle", "riddles", "nyt", "mini", "connections",
}


def _get(url: str, timeout=25) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (OpenClaw MarketIntel Bot)",
        "Accept": "application/json,text/html,application/xml,*/*",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="ignore")


def _write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def crawl_reddit(now_tag: str):
    rows = []
    for sub in SUBREDDITS:
        for listing in ["top?t=day", "hot", "new"]:
            url = f"https://www.reddit.com/r/{sub}/{listing}.json?limit=50"
            try:
                raw = _get(url)
                data = json.loads(raw)
                children = data.get("data", {}).get("children", [])
                for c in children:
                    d = c.get("data", {})
                    rows.append({
                        "ts": now_tag,
                        "source": "reddit",
                        "subreddit": sub,
                        "listing": listing,
                        "title": d.get("title", ""),
                        "score": d.get("score", 0),
                        "comments": d.get("num_comments", 0),
                        "created_utc": d.get("created_utc", 0),
                        "url": "https://reddit.com" + d.get("permalink", ""),
                    })
                time.sleep(0.4)
            except Exception as e:
                rows.append({"ts": now_tag, "source": "reddit", "subreddit": sub, "listing": listing, "error": str(e)})
    _write_jsonl(BASE / "raw" / "reddit" / f"{datetime.now().date()}.jsonl", rows)


def crawl_google_trends(now_tag: str):
    rows = []
    for geo in TREND_GEOS:
        url = f"https://trends.google.com/trending/rss?geo={geo}"
        try:
            raw = _get(url)
            root = ET.fromstring(raw)
            for item in root.findall(".//item"):
                title = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                rows.append({
                    "ts": now_tag,
                    "source": "google_trends",
                    "geo": geo,
                    "title": title,
                    "link": link,
                    "traffic": "",
                })
        except Exception as e:
            rows.append({"ts": now_tag, "source": "google_trends", "geo": geo, "error": str(e)})
    _write_jsonl(BASE / "raw" / "google_trends" / f"{datetime.now().date()}.jsonl", rows)


def crawl_appbrain(now_tag: str):
    rows = []
    for url in APPBRAIN_URLS:
        try:
            html = _get(url)
            for m in re.finditer(r'href="(/app/[^"]+)"[^>]*>([^<]{2,120})<', html):
                rel, name = m.group(1), m.group(2).strip()
                if not name:
                    continue
                rows.append({
                    "ts": now_tag,
                    "source": "appbrain",
                    "page": url,
                    "app_name": name,
                    "url": "https://www.appbrain.com" + rel,
                })
            time.sleep(0.4)
        except Exception as e:
            rows.append({"ts": now_tag, "source": "appbrain", "page": url, "error": str(e)})
    _write_jsonl(BASE / "raw" / "appbrain" / f"{datetime.now().date()}.jsonl", rows)


def crawl_play_store(now_tag: str):
    rows = []
    for url in PLAY_STORE_TOP_URLS:
        try:
            html = _get(url)
            for m in re.finditer(r'aria-label="([^"]{2,140})"', html):
                name = (m.group(1) or "").strip()
                if not name:
                    continue
                rows.append({
                    "ts": now_tag,
                    "source": "play_store",
                    "page": url,
                    "app_name": name,
                    "title": name,
                })
            time.sleep(0.4)
        except Exception as e:
            rows.append({"ts": now_tag, "source": "play_store", "page": url, "error": str(e)})
    _write_jsonl(BASE / "raw" / "play_store" / f"{datetime.now().date()}.jsonl", rows)


def crawl_x_trends(now_tag: str):
    rows = []
    for url in X_TRENDS24_URLS:
        try:
            html = _get(url)
            found = set()
            patterns = [
                r'href="/hashtag/([^"]+)"',
                r'>(#[A-Za-z0-9_]{2,80})<',
                r'"trend-name">([^<]{2,120})<',
            ]
            for pat in patterns:
                for m in re.finditer(pat, html):
                    raw = (m.group(1) or "").strip()
                    trend = urllib.parse.unquote_plus(raw).replace("-", " ").strip("# ")
                    if trend and trend.lower() not in found:
                        found.add(trend.lower())
                        rows.append({
                            "ts": now_tag,
                            "source": "x_trends",
                            "page": url,
                            "title": trend,
                        })
            time.sleep(0.4)
        except Exception as e:
            rows.append({"ts": now_tag, "source": "x_trends", "page": url, "error": str(e)})
    _write_jsonl(BASE / "raw" / "x_trends" / f"{datetime.now().date()}.jsonl", rows)


def _extract_terms_from_row(row):
    txt = " ".join(str(row.get(k, "")) for k in ["title", "app_name"]).lower()
    words = re.findall(r"[a-záéíóúñ]{4,}", txt)
    return [w for w in words if w not in STOPWORDS]


def summarize(now_tag: str):
    src_files = (
        list((BASE / "raw" / "reddit").glob("*.jsonl"))
        + list((BASE / "raw" / "google_trends").glob("*.jsonl"))
        + list((BASE / "raw" / "appbrain").glob("*.jsonl"))
        + list((BASE / "raw" / "play_store").glob("*.jsonl"))
        + list((BASE / "raw" / "x_trends").glob("*.jsonl"))
    )
    terms = {}
    total = 0
    for fp in src_files:
        for line in fp.read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                row = json.loads(line)
            except Exception:
                continue
            for w in _extract_terms_from_row(row):
                terms[w] = terms.get(w, 0) + 1
            total += 1

    top = sorted(terms.items(), key=lambda x: x[1], reverse=True)[:80]
    out = {
        "ts": now_tag,
        "records_scanned": total,
        "top_terms": top,
        "sources": [str(p) for p in src_files],
    }
    out_path = BASE / "analysis" / f"{datetime.now().date()}_summary.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path, out


def _load_daily_summaries():
    data = []
    for fp in sorted((BASE / "analysis").glob("*_summary.json")):
        try:
            obj = json.loads(fp.read_text(encoding="utf-8", errors="ignore"))
            date = fp.name.split("_summary.json")[0]
            terms = {k: int(v) for k, v in obj.get("top_terms", [])}
            data.append({
                "date": date,
                "records_scanned": int(obj.get("records_scanned", 0)),
                "terms": terms,
            })
        except Exception:
            continue
    return data


def _top_risers(today_terms, prev_terms, limit=5):
    deltas = []
    for term, count in today_terms.items():
        prev = prev_terms.get(term, 0)
        delta = count - prev
        if delta > 0:
            deltas.append((term, delta, count))
    deltas.sort(key=lambda x: (x[1], x[2]), reverse=True)
    return deltas[:limit]


def _puzzle_signal_line(today_terms, prev_terms):
    items = []
    for term in PUZZLE_WORD_SIGNALS:
        if term in today_terms:
            delta = today_terms.get(term, 0) - prev_terms.get(term, 0)
            items.append((term, today_terms.get(term, 0), delta))
    items.sort(key=lambda x: (x[2], x[1]), reverse=True)
    return items[:6]


def _market_takeaway(risers, puzzle_items):
    if not risers:
        return "Momentum appears stable vs prior day; no meaningful positive term acceleration detected."
    strong_puzzle = [p for p in puzzle_items if p[2] > 0]
    if strong_puzzle:
        return (
            "Puzzle/word intent is rising. Consider ASO around daily challenge loops, streak retention, and social sharing hooks; "
            "short-session repeatability remains a core monetization driver."
        )
    return (
        "Growth is broad but not puzzle-specific. Monitor adjacent casual genres and cross-promote word/puzzle titles via events "
        "or limited-time modes to capture spillover demand."
    )


def update_html_report():
    days = _load_daily_summaries()
    if not days:
        return None

    rows_html = []
    for i, day in enumerate(days):
        prev_terms = days[i - 1]["terms"] if i > 0 else {}
        risers = _top_risers(day["terms"], prev_terms)
        puzzle_items = _puzzle_signal_line(day["terms"], prev_terms)

        risers_text = ", ".join(f"{t} (+{d})" for t, d, _ in risers) if risers else "—"
        puzzle_text = ", ".join(
            f"{t} ({c}, {'+' if d >= 0 else ''}{d})" for t, c, d in puzzle_items
        ) if puzzle_items else "No direct word/puzzle signal in top terms"
        takeaway = _market_takeaway(risers, puzzle_items)

        rows_html.append(
            "<tr>"
            f"<td>{escape(day['date'])}</td>"
            f"<td>{day['records_scanned']}</td>"
            f"<td>{escape(risers_text)}</td>"
            f"<td>{escape(puzzle_text)}</td>"
            f"<td>{escape(takeaway)}</td>"
            "</tr>"
        )

    html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Market Intel Trend Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 20px; color: #1f2937; }}
    h1 {{ margin: 0 0 8px 0; }}
    .meta {{ color: #6b7280; margin-bottom: 16px; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }}
    th {{ background: #f3f4f6; position: sticky; top: 0; }}
    tr:nth-child(even) {{ background: #fafafa; }}
  </style>
</head>
<body>
  <h1>Daily Puzzle / Word Games Trend Report</h1>
  <div class=\"meta\">Auto-updated on each crawler run. Data sources: Reddit, Google Trends, AppBrain, Play Store, Trends24.</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Records scanned</th>
        <th>Main increases (term deltas)</th>
        <th>Puzzle/word signals</th>
        <th>Market analysis takeaway</th>
      </tr>
    </thead>
    <tbody>
      {''.join(rows_html)}
    </tbody>
  </table>
</body>
</html>
"""

    out_path = BASE / "analysis" / "trend_report.html"
    out_path.write_text(html, encoding="utf-8")
    return out_path


def main():
    now_tag = datetime.now(timezone.utc).isoformat()
    crawl_reddit(now_tag)
    crawl_google_trends(now_tag)
    crawl_appbrain(now_tag)
    crawl_play_store(now_tag)
    crawl_x_trends(now_tag)
    summary_path, _ = summarize(now_tag)
    report_path = update_html_report()
    print(str(summary_path))
    if report_path:
        print(str(report_path))


if __name__ == "__main__":
    main()
