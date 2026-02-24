from __future__ import annotations

import itertools
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path(r"C:\Users\robby\.openclaw\workspace\outputs\connections-sports")
COUNTRIES = ["US", "UK", "MX", "ES"]


def parse_line(line: str):
    s = line.strip()
    if not s:
        return None
    if not (s.startswith('{"') and s.endswith('"}')):
        raise ValueError(f"Bad format: {s[:120]}")
    inner = s[2:-2]
    parts = inner.split('", "')
    if len(parts) != 7:
        raise ValueError(f"Expected 7 fields, got {len(parts)}: {s[:120]}")
    seq, diff, cat, w1, w2, w3, w4 = parts
    return {
        "seq": int(seq),
        "diff": int(diff),
        "cat": cat,
        "words": [w1, w2, w3, w4],
    }


def load_country(cc: str):
    path = BASE / f"connections_sports_{cc}.txt"
    rows = []
    with path.open(encoding="utf-8") as f:
        for ln, line in enumerate(f, start=1):
            try:
                row = parse_line(line)
                if row:
                    row["line"] = ln
                    rows.append(row)
            except Exception as e:
                raise RuntimeError(f"{path}:{ln}: {e}")
    return rows


def normalize(w: str):
    return w.strip().upper()


def group_quality(rows):
    issues = []
    for r in rows:
        if r["diff"] not in {1, 2, 3, 4}:
            issues.append((r["seq"], "invalid_diff"))
        words = [normalize(w) for w in r["words"]]
        if len(set(words)) < 4:
            issues.append((r["seq"], "duplicate_inside_group"))
        if any(" " in w for w in words):
            issues.append((r["seq"], "multiword_found"))
    return issues


def build_conflict_stats(rows):
    by_diff = defaultdict(list)
    for r in rows:
        by_diff[r["diff"]].append(r)

    # word reuse across whole country
    word_count = Counter()
    for r in rows:
        for w in r["words"]:
            word_count[normalize(w)] += 1

    reused_words = {w: c for w, c in word_count.items() if c > 1}

    # pairwise collision rate between difficulty buckets
    pair_collision = {}
    for d1, d2 in itertools.combinations([1, 2, 3, 4], 2):
        a = by_diff[d1]
        b = by_diff[d2]
        total = len(a) * len(b)
        if total == 0:
            pair_collision[(d1, d2)] = 0.0
            continue
        collisions = 0
        b_words = [set(normalize(x) for x in r["words"]) for r in b]
        for ra in a:
            sa = set(normalize(x) for x in ra["words"])
            for sb in b_words:
                if sa & sb:
                    collisions += 1
        pair_collision[(d1, d2)] = collisions / total

    return by_diff, reused_words, pair_collision


def build_valid_boards(rows, target=200, seed=123):
    random.seed(seed)
    by_diff = defaultdict(list)
    for r in rows:
        by_diff[r["diff"]].append(r)

    if any(len(by_diff[d]) == 0 for d in [1, 2, 3, 4]):
        return []

    boards = []
    seen_signatures = set()

    # Precompute normalized word sets
    ws = {id(r): set(normalize(x) for x in r["words"]) for r in rows}

    attempts = 0
    while len(boards) < target and attempts < 300000:
        attempts += 1
        pick = [random.choice(by_diff[d]) for d in [1, 2, 3, 4]]
        sets = [ws[id(r)] for r in pick]

        # strict uniqueness: 16 unique words
        if len(set().union(*sets)) != 16:
            continue

        # heuristic anti-ambiguity: category labels all different
        cats = [r["cat"].upper() for r in pick]
        if len(set(cats)) != 4:
            continue

        sig = tuple(sorted(r["seq"] for r in pick))
        if sig in seen_signatures:
            continue
        seen_signatures.add(sig)

        boards.append({
            "group_ids": [r["seq"] for r in pick],
            "cats": [r["cat"] for r in pick],
            "difficulties": [r["diff"] for r in pick],
            "words": [w for r in pick for w in r["words"]],
        })

    return boards


def main():
    report = {}
    out_safe_dir = BASE / "validated_boards"
    out_safe_dir.mkdir(parents=True, exist_ok=True)

    for cc in COUNTRIES:
        rows = load_country(cc)
        issues = group_quality(rows)
        by_diff, reused_words, pair_collision = build_conflict_stats(rows)
        safe_boards = build_valid_boards(rows, target=250, seed=100 + len(cc))

        # save safe boards
        safe_path = out_safe_dir / f"safe_boards_{cc}.json"
        with safe_path.open("w", encoding="utf-8") as f:
            json.dump(safe_boards, f, ensure_ascii=False, indent=2)

        report[cc] = {
            "groups": len(rows),
            "issues_count": len(issues),
            "issues_sample": issues[:10],
            "difficulty_counts": {str(d): len(by_diff[d]) for d in [1, 2, 3, 4]},
            "reused_words_count": len(reused_words),
            "top_reused_words": sorted(reused_words.items(), key=lambda x: x[1], reverse=True)[:15],
            "pair_collision_rate": {f"{a}-{b}": round(v, 4) for (a, b), v in pair_collision.items()},
            "safe_boards_generated": len(safe_boards),
            "safe_boards_file": str(safe_path),
        }

    report_path = BASE / "validation_report.json"
    with report_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(report_path)


if __name__ == "__main__":
    main()
