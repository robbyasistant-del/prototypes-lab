# R12 Pie-Slice Render Rework Plan

## Goal
Replace the current donut-style platform rendering with a much clearer 2D read: large pie-slice / cake-slice triangle platforms that radiate from the pillar center. Preserve all gameplay systems exactly as they already work: row generation, sweep collision, bounce behavior, combo, score, camera anchoring, controls, and audio.

## Constraints
- **Gameplay must remain unchanged.** Only rendering and presentation should shift.
- **Gap readability is the priority.** The opening must read immediately in motion and in stills.
- **2D-first clarity beats fake 3D complexity.** Reduce visual ambiguity caused by annulus bands and inner/outer cut walls.
- **Existing row data stays authoritative.** `gapStart`, `gapEnd`, and `segments` continue driving collision and clear logic.

## Render Strategy

### 1) Reinterpret each row’s safe arc as pie-slice wedges
Current data already defines the safe angular span (`segments`) plus the gap span (`gapStart/gapEnd`).

For R12:
- Draw each safe segment as one or more **center-anchored wedge triangles / pie pieces**.
- Wedges start visually near the pillar center and expand outward to the row radius.
- Keep a small center cap offset so the wedge visually connects to the pillar without collapsing into noise.

### 2) Make the gap explicit via absence + guide styling
The gap should be obvious from three simultaneous cues:
- No safe wedge drawn in the gap arc.
- A soft translucent “drop lane” / void fan rendered behind the missing arc.
- Bright edge highlights on the two gap boundaries so the opening reads as a real break.

### 3) Preserve front/back layering without ring geometry
Instead of thick donut walls:
- Back layer: pale compressed wedges behind the pillar.
- Front layer: larger saturated wedges in front of the pillar.
- Optional small underside / trailing shadow only on front wedges to give depth without turning them back into tubes.

### 4) Split long safe spans into one or two visual pieces
To satisfy the requested direction:
- For wide safe spans, use either **one dominant triangle** or **two pie-slice pieces**.
- Prefer two pieces when a single wedge becomes too visually blunt or masks the gap.
- This is a visual subdivision only; collision still uses the original safe arc.

### 5) Keep shatter/particles compatible
Existing clear logic already shatters using segment spans.
- Update shard spawn positions to emit from wedge mids so the break still feels tied to the new shapes.
- No scoring/mechanical change.

## Implementation Steps
1. **Document plan** in this file.
2. **Version bump** strings to `v2026.03.27-r12`.
3. **Replace ring-face drawing helpers** with wedge/pie-slice helpers:
   - angle partition helper for safe spans
   - front/back visibility sampling
   - wedge polygon tracing from inner anchor to outer arc
   - gap-void fan rendering
4. **Refactor `drawRow()`** to:
   - compute row rotation
   - draw back wedges
   - draw pillar
   - draw front wedges
   - draw gap emphasis on front layer
5. **Tune colors** for instant readability:
   - bright top face
   - darker underside shadow
   - thin rim highlight
   - translucent cool-toned gap void
6. **Verify locally** with autostart screenshots and sanity checks:
   - prototype loads
   - no JS errors
   - platforms clearly read as radial wedges
   - gaps remain visually obvious
7. **Sync public copies** to `docs/2026-03-26-helix-jump-clone/` and `docs/prototypes_html/2026-03-26-helix-jump-clone/`.
8. **Commit + push** to `origin/master`.

## Acceptance Checklist
- [ ] Platforms no longer read as donut rings.
- [ ] Safe platforms read as radial pie-slice wedges / triangles.
- [ ] Gap is obvious in still image and during motion.
- [ ] Mechanics and controls remain unchanged.
- [ ] Public docs copies updated.
- [ ] Commit pushed to origin/master.
