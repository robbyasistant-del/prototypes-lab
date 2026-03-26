# Helix Fall rebuild note — r10 mechanic-match

This pass corrects the core platform interaction to behave much more like Helix Jump.

## Mechanic correction
- The ball stays visually centered while the tower rotates beneath it.
- Blue/safe platform slices now **catch the ball and give a modest bounce**.
- The ball **does not pass through safe slices** anymore.
- Only the **gap** allows the ball to continue downward.
- When a platform is passed through the gap, that platform now **breaks visually** and awards score.
- Red/danger wedges still end the run.

## Why this changed
The prior tower-spin rebuild had the right presentation idea, but the interaction was still off: safe hits could feel too permissive and scoring did not clearly map to clearing a level. The target feel is the classic Helix Jump loop: wait/bounce on safe, keep falling only through gaps, and treat each passed platform as a clear.

## What changed in r10
- Simplified collision handling around a single downward crossing test per platform row.
- Safe collisions now snap the ball to the platform top and apply a small readable rebound.
- Gap clears now mark the platform as cleared, spawn break shards, and award score there instead of on ordinary bounces.
- Cleared rows fade out and stop participating in collision.
- Kept the ball centered and the tower-driven rotation model from the previous rebuild.
- Updated the visible version label to `v2026.03.26-r10 mechanic-match`.
- Synced the docs mirror so the public copy matches the working prototype.

## Reference note
Web search tooling was unavailable in this environment, so this correction used established knowledge of the original Helix Jump interaction: safe platform = stop + small bounce, gap = pass + break + score.

## Verification intent
Local verification should confirm: stable safe bounces without tunneling or repeated false hits, no passing through blue slices, visible break-on-gap feedback, score only when clearing through gaps, and mirrored docs output matching the prototype.
