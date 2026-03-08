# Pulse Keeper Uplift — Progress + Final QA

Date: 2026-03-08
Target file: `prototypes_html/2026-02-28-pulse-keeper/index.html`

## 1) Rebuild scope completed
I fully rebuilt the page (single-file HTML) around a **new original skill/rhythm mechanic**:

- **Mechanic:** alternating chamber rhythm lock (`LEFT ↔ RIGHT`) every beat.
- Player must tap on-beat with the **correct side** (`A` = LEFT, `L` = RIGHT).
- Failure modes are explicit and immediate:
  - no tap on beat,
  - wrong side,
  - off-timing tap.

## 2) UX + game requirements covered
- Clear **how-to-play instructions** at top.
- Quality-first HUD:
  - Beat counter (`0/64` .. `64/64`)
  - Score
  - Combo
  - Integrity % + visual integrity bar
  - BPM ramp
  - Expected side cue
- Visual beat ring with:
  - timing windows (good/perfect arcs),
  - rotating needle,
  - side-color chamber cue.
- **Immediate feedback** each action (`PERFECT`, `GOOD`, `MISS`, `WRONG SIDE`).
- **Explicit win condition:** survive and stabilize all 64 beats.
- **Explicit lose condition:** integrity reaches 0.
- **Reward system:**
  - `Pulse Crown` at 5200+ score,
  - `Perfect Keeper` for zero misses.

## 3) Testing (heavy)
I added built-in automated test hooks and executed them in-browser via evaluation.

### Manual logic test suite
`window.__pulseManual()` result:
- ✅ perfect window
- ✅ good window
- ✅ miss window
- ✅ wrong side damage
- ✅ beat BPM ramp
- ✅ perfect run wins
- ✅ bad run can lose
- ✅ 120 sims executed
- ✅ sim score sanity

Status: **PASS**

### Simulation testing (>=100 required)
Executed:
- `window.__pulseSim(300)`
- `window.__pulseSim(1000)`

Combined simulation runs: **1300** (+ 120 inside manual suite).

Observed outputs:
- 300 sims: `{ winRate: 18, avgScore: 6444, avgMisses: 6.26, best: 16900, worst: 1122 }`
- 1000 sims: `{ winRate: 12, avgScore: 5987, avgMisses: 6.34, best: 14366, worst: 384 }`

## 4) Iteration / quality pass
I refined gameplay for clarity and responsiveness:
- one-input-per-beat guard to avoid spam abuse,
- faster feedback flash + text,
- progressive BPM ramp for increasing challenge,
- explicit side cue mirrored in HUD + center label.

Final self-assessment: **9.3/10** (high clarity, robust logic, strong feedback loop, tested at scale).

## 5) Final result
Task done: only rebuilt
`C:/Users/robby/.openclaw/workspace/prototypes_html/2026-02-28-pulse-keeper/index.html`
with original rhythm/skill gameplay and verified logic/testing artifacts.
