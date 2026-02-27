import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
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
                traffic = (item.findtext("ht:approx_traffic", default="") if False else "")
                link = (item.findtext("link") or "").strip()
                rows.append({
                    "ts": now_tag,
                    "source": "google_trends",
                    "geo": geo,
                    "title": title,
                    "link": link,
                    "traffic": traffic,
                })
        except Exception as e:
            rows.append({"ts": now_tag, "source": "google_trends", "geo": geo, "error": str(e)})
    _write_jsonl(BASE / "raw" / "google_trends" / f"{datetime.now().date()}.jsonl", rows)


def crawl_appbrain(now_tag: str):
    rows = []
    for url in APPBRAIN_URLS:
        try:
            html = _get(url)
            # very lightweight extraction: app links + nearby text blocks
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


def summarize(now_tag: str):
    src_files = list((BASE / "raw" / "reddit").glob("*.jsonl")) + list((BASE / "raw" / "google_trends").glob("*.jsonl")) + list((BASE / "raw" / "appbrain").glob("*.jsonl")) + list((BASE / "raw" / "play_store").glob("*.jsonl")) + list((BASE / "raw" / "x_trends").glob("*.jsonl"))
    terms = {}
    total = 0
    for fp in src_files:
        for line in fp.read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                row = json.loads(line)
            except Exception:
                continue
            txt = " ".join(str(row.get(k, "")) for k in ["title", "app_name"]).lower()
            words = re.findall(r"[a-záéíóúñ]{4,}", txt)
            for w in words:
                if w in {"with", "from", "that", "this", "game", "games", "puzzle", "daily", "para", "como"}:
                    continue
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
    return out_path


def main():
    now_tag = datetime.now(timezone.utc).isoformat()
    crawl_reddit(now_tag)
    crawl_google_trends(now_tag)
    crawl_appbrain(now_tag)
    crawl_play_store(now_tag)
    crawl_x_trends(now_tag)
    out = summarize(now_tag)
    print(str(out))


if __name__ == "__main__":
    main()
