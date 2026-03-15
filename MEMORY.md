# MEMORY.md (main)

## Human & Relationship
- Human should be addressed as **"amo"**.
- Assistant identity: **Robby / Robby, el robot**.
- Preferred communication: **light Spanglish** (mostly Spanish + light English), direct/close tone, concise by default.
- Preferred response format: **mini-summary + steps**.
- Voice preference: when user says **"reply in voice"**, provide a short summarized audio-style response in a neutral service-oriented robotic style.

## Working Style & Decision Rules
- Autonomy is valued: execute directly on technical/tooling/dev choices.
- Ask before strategic business decisions and personal-data related actions.
- Avoid repetitive questioning after clear instructions.
- User prefers execution ownership and forward momentum.

## Core Product Focus
- Build and iterate **daily puzzle/word game loops**.
- Priority stack:
  1. Simple daily puzzle/word apps.
  2. Google Play publishing with ASO/SEO + continuous improvement.
  3. Organic distribution (forums/social/comments).
- Daily trend scouting and sentiment mining are recurring tasks.

## Operations & Rhythm
- Timezone: **Europe/Madrid**.
- Best proactive summary window: **08:00 local**.
- Deep work preference: mornings until ~15:00.

## Ongoing Projects / Targets
- Google Play dev pages tracked:
  - Quirion Games co.
  - Medrodome Software
- Weekly strategic objective (current): autonomous pipeline from trend intel → idea selection → development/testing → publication-ready assets and copy.

## Important Technical Learnings
- Memory search historically failed at times due to embedding quota when using OpenAI.
- Memory search now configured to use **Gemini embeddings** + sqlite vector support.
- Subagent config schema note:
  - `subagents.allowAgents` must be under agent config (not top-level).
  - `sessionTools` under agents list was invalid in this runtime.

## Market/ASO Persistent Signals (curated)
- Strong recurring momentum in: **wordle / word / daily puzzle / brain / short-session loops**.
- Creative authenticity matters (anti-"fake ad" sentiment appeared in community signals).
- Repeated blockers encountered in intel pipeline:
  - Missing/limited external API keys at times.
  - AppBrain anti-bot restrictions (403/Cloudflare).

## File Layout Conventions (important)
- Keep workspace root clean.
- Scripts go to `/scripts`; debug artifacts to `/scripts/debug`.
- Active playable prototype catalog is organized under `/prototypes_html`.
- Root `index.html` should redirect to `/prototypes_html/index.html`.

## Workflow Governance (critical)
- Always read `OPERATING_FRAMEWORK.md` right now
- Apply `OPERATING_FRAMEWORK.md` as the default workflow orchestration guide.
- If task instructions conflict, user direct instruction wins, then update framework-aligned execution plan.
- For multi-agent workflows: enforce phase gates, evidence-based DONE criteria, and QA >=9 before promotion to next phase where applicable.
- Routing convention with user: `@agent_id <instruction>` for direct delegation via Robby (main orchestrator), with Robby returning consolidated responses; supports `@all`, `@auto`, and optional tags `#brief/#full/#raw`, `#async/#sync`.

## Prototype Quality Rule (critical)
- Daily prototype batches must be fully playable games (not mock boards/re-skins).
- Each prototype must include: clear instructions, scoring, reward/badge, clear game-over/win condition, and immediate user feedback.
- Prototypes must be original/varied and grounded on current market intel from `/market_intel` trends.
- User reinforced hard rule (2026-03-08): if quality is poor/confusing for 3rd consecutive day, stop and rebuild quality-first.

## Prototype Factory Hard Requirements (user-mandated)
1) Choose prototypes from trend reports (Top20 + market intel cron outputs), not random ideas.
2) Ship fully playable, attractive, quality prototypes.
3) Run explicit playability tests before delivery.
4) Optimize for addictiveness/retention loop.
5) Polish quality details: graphics, button detail, instructions, help, and result feedback.
6) Invest enough iteration time: at least ~5 minutes per prototype with multiple prompts/tests until good.

- Reject/replace any low-quality or repetitive batch before publication.

----------------------------------------

## Mandatory DB Logging Hard Gate (critical)
Please re-enforce this as a hard gate for all agents in MEMORY.md.
The log write must happen before the agent sends its final reply — not after, not optionally.

Local PostgreSQL target:
- PGHOST=127.0.0.1
- PGPORT=5432
- PGDATABASE=postgres
- PGUSER=postgres
- Table: agent_logs

Required fields:
- agent_name
- task_description
- model_used
- status (completed|failed)

Rule:
- If DB log write fails, agent must report logging failure and must not claim full completion.

## Execution Quality Policy Update (2026-03-13, user-mandated hard rule)
- For large/complex development tasks, **never do one-shot quick completion**.
- Mandatory default: **Sprint Plan → phased execution → checkpoint validation → final QA gate**.
- Do not mark DONE in 1-2 minutes for big tasks unless objective is truly small.
- For complex builds, decompose into sub-tasks and run multi-step implementation (can be multi-hour).
- Use subagents/sessions for long execution blocks and keep traceability of active runs.
- Mandatory cadence for large tasks: checkpoint updates at ~15%, ~50%, ~85%, ~100% with concrete artifact status.
- Minimum structure for large tasks: at least 3 implementation phases (not a single-pass patch).
- Final completion requires evidence: real artifacts + test/verification proof + quality pass.

## Session Recap — 2026-03-13 (key decisions & learnings)
- Epic framework controls implemented in Epics Tab: Start, Run Step, Advance, Pause, Stop; Start is one-time and disabled after `framework_started`.
- Quality-gate and routing fixes applied in epics backend:
  - Phase output path now prioritizes `/workspace/Epic_<EPIC_NAME>/step_<phase>` with fallback by epic id.
  - Evidence parser updated to handle BOM and nested quality gate fields.
  - Run-step/advance behavior clarified and popups added for success/error payload details.
- Heartbeat workflow evolved:
  - Added watchdog behavior for stale `in_progress` tasks.
  - Added real subagent run dispatch traceability (`run/session` in `framework_status`).
  - Agent monitor now reflects real activity from session/log movement (not only DB state).
- Mission Control Content Tab implemented with live data wiring:
  - New API route `/api/content/hot24h`.
  - Content tab UI rendering per source with cards/media links.
  - Fixed daily cron `content-hot24h-1900` now uses stable script `scripts/content_hot24h_collector.py`.
- Collector robustness decisions:
  - Preserve previous source snapshot on per-source failure.
  - Write explicit `notes_by_source` failure reasons.
  - Active sources now working in current environment: **Reddit, X (public mirror scraping), TikTok (public search scraping), YouTube (API key)**.
  - Facebook/Instagram scraping paths added but currently often blocked by public-access/login walls.
- Dashboard Tab rebuilt as real-time summary hub:
  - KPI header, per-tab mini analytics charts, and live agents communication diagram.
  - Auto-refresh every few seconds with data from agents/tasks/ideas/epics/trends/content endpoints.
