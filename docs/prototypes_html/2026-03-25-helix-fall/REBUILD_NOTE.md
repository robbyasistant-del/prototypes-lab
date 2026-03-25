# Helix Fall rebuild note — r7 tower-spin

This iteration changes the core interaction, not just the art.

## Mechanical change
- The ball now stays visually centered above the pillar during play.
- Horizontal input no longer moves the ball across the lane.
- Instead, dragging or pressing left/right rotates the tower beneath the ball.
- Platforms are defined as angular ring slices with safe zones, gaps, and danger wedges.
- As the stack rotates, slices visibly wrap around the pillar and hide toward the left/right sides to better mimic the Helix Jump feel.

## Why
The previous rebuild was readable, but it still felt like steering the ball side to side inside a shaft. The user wanted the stronger Helix Jump fantasy: hold the ball in place and spin the world around it.

## What changed in r7
- Rebuilt gameplay around a shared tower rotation angle and ring-sector collision checks.
- Kept the player orb centered and oversized for mobile readability.
- Rendered platforms as rotating cylindrical bands so the tower visibly turns and slices disappear around the sides.
- Preserved the simple bounce / fall-through-gap / die-on-red loop.
- Kept drag-first controls with keyboard fallback.
- Updated the visible version label to `v2026.03.25-r7 tower-spin`.
- Synced the docs mirror so the public copy matches the prototype.

## Verification intent
Local verification should confirm: centered ball, obvious tower rotation from drag input, readable hidden-side platform motion, functioning gap/danger collision, and matching mirrored docs output.
