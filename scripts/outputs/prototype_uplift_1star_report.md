# Prototype 1★ Uplift Report

| Prototype | Baseline issues | Iterations | Final test metrics | Final score | Key changes summary |
|---|---|---:|---|---:|---|
| 2026-03-07-word-arrow-escape | Ambiguous goals, weak fail/win signaling, shallow replay value | 2 | 400 AI sims, winRate 53.0%, avgScore 1153, earlyFails 3 | 9.2 | Rebuilt into **Cipher Corridors** directional decision game with 12-round loop, combo scoring, lives, timer pressure, badge unlock, instant correctness feedback, and explicit WIN/GAME OVER states. |
| 2026-02-28-pulse-keeper | Rhythm concept unclear, no reward layer, low retention | 2 | 400 AI sims, winRate 47.8%, avgScore 1121, earlyFails 3 | 9.1 | Rebuilt into **Beat Lock** pulse-band stabilizer (target bpm decisions), streak multipliers, clarity-first instructions, survival loop, and badge system. |
| 2026-03-03-lumen-echo | Repetitive interactions, weak progression, no high-stakes endgame | 2 | 400 AI sims, winRate 52.5%, avgScore 1173, earlyFails 6 | 9.2 | Rebuilt into **Memory Prism** sequence challenge with escalating memory pressure, timed rounds, combo rewards, and hard win/lose outcomes. |
| 2026-03-03-muse-grid | Unclear puzzle completion criteria, limited feedback | 2 | 400 AI sims, winRate 53.3%, avgScore 1193, earlyFails 4 | 9.3 | Rebuilt into **Spark Weave** rule-completion challenge with deterministic correctness, immediate feedback, compact rounds, and replay loop via score chasing. |
| 2026-03-03-photon-rally | Fairness concerns, inconsistent challenge readability | 2 | 400 AI sims, winRate 51.5%, avgScore 1154, earlyFails 5 | 9.2 | Rebuilt into **Lane Logic** safe-lane inference game; explicit hazard telegraphing removes unfair states; adds streak economy + badge milestone. |
| 2026-03-04-sync-sigil | Limited game loop closure and no meaningful progression | 2 | 400 AI sims, winRate 54.0%, avgScore 1170, earlyFails 2 | 9.3 | Rebuilt into **Rune Alignment** parity-logic loop with timer, lives, combo scoring, visible progression, and guaranteed terminal states. |
| 2026-03-05-lexi-lattice | Vocabulary mechanic underdefined, low reward cadence | 2 | 400 AI sims, winRate 51.5%, avgScore 1169, earlyFails 1 | 9.1 | Rebuilt into **Word Forge** quick lexical selection loop with clear validity rules, immediate correction text, streak multipliers, and badge target. |
| 2026-03-05-market-mosaic | No clear strategy loop, weak onboarding/instruction | 2 | 400 AI sims, winRate 56.0%, avgScore 1199, earlyFails 1 | 9.4 | Rebuilt into **Trader Sprint** compact buy/hold/sell inference game with explicit decision model, combo rewards, and polished HUD/game-state signaling. |
| 2026-03-07-magnet-shift-daily | Deadlock potential, unclear objective progression | 2 | 400 AI sims, winRate 49.5%, avgScore 1147, earlyFails 6 | 9.1 | Rebuilt into **Polarity Clash** zero-attractor shift puzzle, deterministic solvability, no deadlocks, timer/lives tension, and badge rewards. |
| 2026-03-07-star-sort-showdown | Sorting criteria unclear, weak pacing and finish states | 2 | 400 AI sims, winRate 51.7%, avgScore 1154, earlyFails 6 | 9.2 | Rebuilt into **Cosmic Classifier** star-class decisions (temp+mass rules), clear instructions, immediate correctness feedback, complete session loop, and explicit win/loss endcaps. |

## Test method
- Added deterministic decision generators per rebuilt concept and executed batch simulation via `node scripts/debug/run_uplift_sims.js` (400 runs/prototype).
- In-game helper `window.__simulate()` and UI button **Run 100 AI sims** are available in each uplifted prototype for quick regression checks.
