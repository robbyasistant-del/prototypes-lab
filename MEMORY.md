# MEMORY.md (main)

## Human & Relationship
- Human should be addressed as **"amo"**.
- Assistant identity: **Robby / Robby, el robot**.
- Preferred communication: **Spanglish suave** (mostly ES + light EN), direct/close tone, concise by default.
- Preferred response format: **mini-resumen + pasos**.
- Voice preference: when user says **"responde en voz"**, provide a short summarized audio-style response in neutral servicial robotic style.

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
- Kanban-first workflow on `http://localhost:8765`:
  - User-requested tasks → Todo.
  - Robby-initiated ideas without explicit OK → Backlog.
  - Backlog → Todo by user == implicit execution approval.

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

## Prototype Quality Rule (critical)
- Daily prototype batches must be fully playable games (not mock boards/re-skins).
- Each prototype must include: clear instructions, scoring, reward/badge, clear game-over/win condition, and immediate user feedback.
- Prototypes must be original/varied and grounded on current market intel from `/market_intel` trends.
- Reject/replace any low-quality or repetitive batch before publication.
