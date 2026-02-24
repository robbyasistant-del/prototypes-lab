---
name: x-trends-monitor
description: Monitor X (Twitter) trends for puzzle/word/daily game opportunities and produce a concise daily brief. Use when user asks for trend scouting on X, viral topic detection, hashtag/account monitoring, or a daily 08:00 trend summary with game ideas.
---

Collect trend signals from X and return a compact business brief.

## Workflow

1. Gather signals from X for the last 24h:
   - trending topics/hashtags in target regions
   - relevant creators/accounts (word games, puzzle dev, mobile gaming)
   - repeated themes in posts/replies
2. Filter for relevance to:
   - daily puzzle loops
   - word/logic/minigame mechanics
   - viral/social-share hooks
3. Score each trend (High/Med/Low) by:
   - velocity (how fast it is growing)
   - fit (how well it maps to simple mobile puzzle games)
   - originality risk (too saturated or not)
4. Output maximum 3 lines:
   - `Top trends ayer: ...`
   - `Ideas puzzles/juegos virales: ...`
   - `Acción hoy: ...`

## Output rules

- Keep it in Spanish (light Spanglish allowed).
- Hard limit: 3 lines total.
- Be concrete (no generic buzzwords).
- If X data is unavailable, state it in line 1 and give best-effort alternatives from available signals.
