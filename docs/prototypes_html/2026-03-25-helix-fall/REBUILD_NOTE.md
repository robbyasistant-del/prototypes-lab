# Helix Fall rebuild note — r11 solid-sweep

This pass replaces the fragile one-shot platform check with a deterministic swept collision pass.

## Mechanic correction
- Cyan/blue platform slices are now **genuinely solid**.
- The ball **cannot pass through cyan** anymore.
- The ball may **only** pass through the **black gap**.
- Safe hits now do a true **position correction to the platform top** plus a small **upward bounce**.
- Red/danger wedges still kill immediately.
- Gap clears still break the row and award score.

## What structurally changed
- Reworked the fall resolution into a **continuous downward sweep** instead of a single end-of-frame check.
- Each frame now tracks the ball’s downward travel in **substeps**, then tests every platform crossed in order.
- For each crossed platform, collision state is sampled at the **exact crossing moment** using the interpolated tower angle.
- A safe result immediately **snaps the ball above the platform** and reverses velocity, which prevents tunneling and repeated bounce spam.
- A gap result clears that platform and lets the sweep continue downward.
- A danger result ends the run on contact.

## Why this fixes the bug
The previous logic only asked “what is under the ball at one late instant?” which still allowed the ball to slip through cyan when timing/rotation lined up badly. The new logic resolves the entire downward path, so every crossed row gets a real contact decision before the ball can move past it.

## Version
Visible version label updated to `v2026.03.26-r11 solid-sweep`.

## Verification target
Local verification should confirm:
- cyan cannot be tunneled through,
- black gap allows passing and clearing/scoring,
- red still kills,
- no sticking / repeated collision spam,
- docs mirrors match the prototype copy.
