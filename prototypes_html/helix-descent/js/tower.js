/**
 * Helix Descent — Procedural Tower Generation
 * Generates rings with gaps, safe zones, and danger zones.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Tower = (function () {
    'use strict';

    var PI2 = Math.PI * 2;

    // Segment types
    var SEG_SAFE   = 0;
    var SEG_GAP    = 1;
    var SEG_DANGER = 2;

    /**
     * A Ring at a given depth.
     * segments: [{ start, end, type }]  — angles in [0, 2π), tower-local
     */
    function Ring(depth, floor) {
        this.depth = depth;
        this.floor = floor;
        this.segments = [];
        this.passed = false;       // ball has fallen past this ring
        this.destroyed = false;    // visual: platform crumble animation
        this.destroyTimer = 0;
    }

    var rings = [];
    var nextFloor = 0;
    var nextDepth = 0;
    var RING_SPACING = 1.0;        // world units between rings
    var GENERATE_AHEAD = 15;       // rings ahead of ball
    var REMOVE_BEHIND = 5;         // rings behind ball before removal

    /* ---- Difficulty scaling ---- */

    function gapWidth(floor) {
        // Starts wide (~80°), narrows to ~40° at floor 200+
        var base = 1.4;   // radians (~80°)
        var minW = 0.7;   // radians (~40°)
        var t = Math.min(floor / 200, 1);
        return base - (base - minW) * t;
    }

    function dangerChance(floor) {
        // No danger for first 8 floors, then ramps up
        if (floor < 8) return 0;
        return Math.min(0.6, (floor - 8) / 150);
    }

    function dangerWidth(floor) {
        var base = 0.5;  // ~29°
        var maxW = 1.2;  // ~69°
        var t = Math.min(floor / 250, 1);
        return base + (maxW - base) * t;
    }

    function extraGapChance(floor) {
        // Chance for a second gap (makes some rings easier, adds variety)
        if (floor < 15) return 0.3;
        return Math.max(0.05, 0.3 - floor / 500);
    }

    /* ---- Generation ---- */

    function generateRing(floor, depth) {
        var ring = new Ring(depth, floor);
        var gw = gapWidth(floor);

        // Primary gap at random angle
        var gapStart = Math.random() * PI2;
        var gapEnd = (gapStart + gw) % PI2;

        // Optional second gap (opposite side for variety)
        var hasSecondGap = Math.random() < extraGapChance(floor);
        var gap2Start = -1, gap2End = -1;
        if (hasSecondGap) {
            var offset = PI2 * 0.4 + Math.random() * PI2 * 0.2; // 144°–216° away
            gap2Start = (gapStart + offset) % PI2;
            var gw2 = gw * (0.6 + Math.random() * 0.4);
            gap2End = (gap2Start + gw2) % PI2;
        }

        // Danger zones
        var dangers = [];
        if (Math.random() < dangerChance(floor)) {
            var dw = dangerWidth(floor);
            // Place danger zone away from gaps
            var dangerStart = (gapEnd + 0.3 + Math.random() * (PI2 - gw - dw - 0.6)) % PI2;
            var dangerEnd = (dangerStart + dw) % PI2;

            // Verify danger doesn't overlap gaps
            if (!anglesOverlap(dangerStart, dangerEnd, gapStart, gapEnd) &&
                (!hasSecondGap || !anglesOverlap(dangerStart, dangerEnd, gap2Start, gap2End))) {
                dangers.push({ start: dangerStart, end: dangerEnd });
            }
        }

        // Build segments by sweeping 0→2π
        ring.segments = buildSegments(gapStart, gapEnd,
            hasSecondGap ? gap2Start : -1,
            hasSecondGap ? gap2End : -1,
            dangers);

        return ring;
    }

    /** Check if two angular ranges overlap (ranges may wrap around 2π). */
    function anglesOverlap(s1, e1, s2, e2) {
        return angleInRange(s1, s2, e2) || angleInRange(e1, s2, e2) ||
               angleInRange(s2, s1, e1) || angleInRange(e2, s1, e1);
    }

    function angleInRange(a, start, end) {
        a = ((a % PI2) + PI2) % PI2;
        start = ((start % PI2) + PI2) % PI2;
        end = ((end % PI2) + PI2) % PI2;
        if (start <= end) return a >= start && a <= end;
        return a >= start || a <= end;  // wraps around
    }

    function buildSegments(g1s, g1e, g2s, g2e, dangers) {
        // Create a list of angular boundaries and classify each region
        var points = [];
        addBoundary(points, g1s, 'gap_start');
        addBoundary(points, g1e, 'gap_end');
        if (g2s >= 0) {
            addBoundary(points, g2s, 'gap_start');
            addBoundary(points, g2e, 'gap_end');
        }
        for (var i = 0; i < dangers.length; i++) {
            addBoundary(points, dangers[i].start, 'danger_start');
            addBoundary(points, dangers[i].end, 'danger_end');
        }

        // Sort by angle
        points.sort(function (a, b) { return a.angle - b.angle; });

        if (points.length === 0) {
            // Full safe ring (shouldn't happen, but safety)
            return [{ start: 0, end: PI2, type: SEG_SAFE }];
        }

        // Walk around the circle, determining type of each region
        var segs = [];
        for (var j = 0; j < points.length; j++) {
            var curr = points[j].angle;
            var next = points[(j + 1) % points.length].angle;
            if (next <= curr) next += PI2;
            var mid = ((curr + next) / 2) % PI2;

            var type = SEG_SAFE;
            if (angleInRange(mid, g1s, g1e)) type = SEG_GAP;
            if (g2s >= 0 && angleInRange(mid, g2s, g2e)) type = SEG_GAP;
            for (var k = 0; k < dangers.length; k++) {
                if (angleInRange(mid, dangers[k].start, dangers[k].end)) type = SEG_DANGER;
            }

            var segEnd = points[(j + 1) % points.length].angle;
            if (segEnd === curr) continue;
            segs.push({ start: curr, end: segEnd, type: type });
        }

        // Merge adjacent segments of same type
        return mergeSegments(segs);
    }

    function addBoundary(arr, angle, label) {
        arr.push({ angle: ((angle % PI2) + PI2) % PI2, label: label });
    }

    function mergeSegments(segs) {
        if (segs.length <= 1) return segs;
        var merged = [segs[0]];
        for (var i = 1; i < segs.length; i++) {
            var prev = merged[merged.length - 1];
            if (segs[i].type === prev.type) {
                prev.end = segs[i].end;
            } else {
                merged.push(segs[i]);
            }
        }
        // Check wrap-around merge
        if (merged.length > 1 && merged[0].type === merged[merged.length - 1].type) {
            merged[merged.length - 1].end = merged[0].end;
            merged.shift();
        }
        return merged;
    }

    /* ---- Public API ---- */

    function reset() {
        rings = [];
        nextFloor = 0;
        nextDepth = 2.0; // first ring is 2 units below start
    }

    /** Ensure enough rings exist ahead of the ball. */
    function update(ballDepth) {
        // Generate rings ahead
        while (nextDepth < ballDepth + GENERATE_AHEAD * RING_SPACING) {
            var ring = generateRing(nextFloor, nextDepth);
            rings.push(ring);
            nextFloor++;
            nextDepth += RING_SPACING;
        }

        // Remove rings far behind
        while (rings.length > 0 && rings[0].depth < ballDepth - REMOVE_BEHIND * RING_SPACING) {
            rings.shift();
        }
    }

    /** Get all currently active rings. */
    function getRings() { return rings; }

    /** Get the ring at or just below a given depth, or null. */
    function getRingAtDepth(depth) {
        for (var i = 0; i < rings.length; i++) {
            if (Math.abs(rings[i].depth - depth) < 0.05) return rings[i];
        }
        return null;
    }

    /**
     * Check what segment type the ball would hit at a given ring.
     * ballAngle: the ball's angle in tower-local coordinates [0, 2π).
     * Returns: SEG_SAFE, SEG_GAP, or SEG_DANGER.
     */
    function checkSegment(ring, ballAngle) {
        ballAngle = ((ballAngle % PI2) + PI2) % PI2;
        for (var i = 0; i < ring.segments.length; i++) {
            var seg = ring.segments[i];
            if (angleInRange(ballAngle, seg.start, seg.end)) {
                return seg.type;
            }
        }
        return SEG_SAFE; // fallback
    }

    return {
        SEG_SAFE: SEG_SAFE,
        SEG_GAP: SEG_GAP,
        SEG_DANGER: SEG_DANGER,
        RING_SPACING: RING_SPACING,
        reset: reset,
        update: update,
        getRings: getRings,
        getRingAtDepth: getRingAtDepth,
        checkSegment: checkSegment
    };
})();
