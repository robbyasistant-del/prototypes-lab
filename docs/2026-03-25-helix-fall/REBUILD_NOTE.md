# Helix Fall rebuild note — r4

This iteration is a strong rebuild, not a tune-up.

## Why
The prior prototype still failed the first-read test: the ball, platforms, motion, and controls were not obvious enough to play remotely.

## What was rebuilt
- Replaced the scene presentation with a high-contrast central shaft and thick rails.
- Rebuilt platforms to use very clear safe cyan surfaces, dark gaps, and red kill strips.
- Reworked the player into a large glowing ball with shadow, squash, and burst feedback.
- Simplified the loop so it is readable: fall through gaps for streak/score, bounce on safe, die on red.
- Replaced touch controls with large hold-to-move buttons that are visible on mobile.
- Added stronger UI copy and a visible version bump: `v2026.03.25-r4 rebuild`.

## Verification intent
Local browser screenshots were captured for menu and autoplay gameplay states to confirm the rebuilt version renders visibly before shipping.
