/**
 * Helix Descent — Procedural Tower Generation
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Tower = (function () {
    'use strict';

    var PI2 = Math.PI * 2;
    var SEG_SAFE = 0, SEG_GAP = 1, SEG_DANGER = 2;

    function Ring(depth, floor) {
        this.depth = depth;
        this.floor = floor;
        this.segments = [];
        this.passed = false;
    }

    var rings = [], nextFloor = 0, nextDepth = 0;
    var RING_SPACING = 1.0;
    var GENERATE_AHEAD = 18;
    var REMOVE_BEHIND = 8;

    /* Difficulty curves */
    function gapWidth(floor) {
        // Start very wide (~100°→1.75rad), narrow to ~45°→0.78rad at floor 250+
        if (floor < 10) return 1.75;  // first 10 floors: huge gaps, easy
        var t = Math.min((floor - 10) / 240, 1);
        return 1.75 - (1.75 - 0.78) * t;
    }

    function dangerChance(floor) {
        if (floor < 10) return 0;  // NO danger first 10 floors
        if (floor < 20) return 0.15;
        return Math.min(0.55, 0.15 + (floor - 20) / 200);
    }

    function dangerWidth(floor) {
        return 0.45 + Math.min(floor / 300, 1) * 0.75;
    }

    function extraGapChance(floor) {
        if (floor < 20) return 0.35;
        return Math.max(0.08, 0.35 - floor / 400);
    }

    /* Generation */
    function generateRing(floor, depth) {
        var ring = new Ring(depth, floor);
        var gw = gapWidth(floor);

        var g1s = Math.random() * PI2;
        var g1e = (g1s + gw) % PI2;

        var hasG2 = Math.random() < extraGapChance(floor);
        var g2s = -1, g2e = -1;
        if (hasG2) {
            var off = PI2 * 0.35 + Math.random() * PI2 * 0.3;
            g2s = (g1s + off) % PI2;
            var gw2 = gw * (0.5 + Math.random() * 0.5);
            g2e = (g2s + gw2) % PI2;
        }

        var dangers = [];
        if (Math.random() < dangerChance(floor)) {
            var dw = dangerWidth(floor);
            var ds = (g1e + 0.3 + Math.random() * (PI2 - gw - dw - 0.6)) % PI2;
            var de = (ds + dw) % PI2;
            if (!anglesOverlap(ds, de, g1s, g1e) &&
                (!hasG2 || !anglesOverlap(ds, de, g2s, g2e))) {
                dangers.push({ s: ds, e: de });
            }
        }

        ring.segments = buildSegments(g1s, g1e, hasG2 ? g2s : -1, hasG2 ? g2e : -1, dangers);
        return ring;
    }

    function anglesOverlap(s1, e1, s2, e2) {
        return inRange(s1, s2, e2) || inRange(e1, s2, e2) ||
               inRange(s2, s1, e1) || inRange(e2, s1, e1);
    }

    function inRange(a, s, e) {
        a = ((a % PI2) + PI2) % PI2;
        s = ((s % PI2) + PI2) % PI2;
        e = ((e % PI2) + PI2) % PI2;
        return s <= e ? (a >= s && a <= e) : (a >= s || a <= e);
    }

    function buildSegments(g1s, g1e, g2s, g2e, dangers) {
        var pts = [];
        addPt(pts, g1s); addPt(pts, g1e);
        if (g2s >= 0) { addPt(pts, g2s); addPt(pts, g2e); }
        for (var i = 0; i < dangers.length; i++) { addPt(pts, dangers[i].s); addPt(pts, dangers[i].e); }
        pts.sort(function (a, b) { return a - b; });

        if (!pts.length) return [{ start: 0, end: PI2, type: SEG_SAFE }];

        var segs = [];
        for (var j = 0; j < pts.length; j++) {
            var curr = pts[j], next = pts[(j + 1) % pts.length];
            if (next <= curr) next += PI2;
            var mid = ((curr + next) / 2) % PI2;
            var type = SEG_SAFE;
            if (inRange(mid, g1s, g1e)) type = SEG_GAP;
            if (g2s >= 0 && inRange(mid, g2s, g2e)) type = SEG_GAP;
            for (var k = 0; k < dangers.length; k++) {
                if (inRange(mid, dangers[k].s, dangers[k].e)) type = SEG_DANGER;
            }
            var se = pts[(j + 1) % pts.length];
            if (se === curr) continue;
            segs.push({ start: curr, end: se, type: type });
        }
        return mergeSegs(segs);
    }

    function addPt(arr, a) { arr.push(((a % PI2) + PI2) % PI2); }

    function mergeSegs(segs) {
        if (segs.length <= 1) return segs;
        var m = [segs[0]];
        for (var i = 1; i < segs.length; i++) {
            var prev = m[m.length - 1];
            if (segs[i].type === prev.type) prev.end = segs[i].end;
            else m.push(segs[i]);
        }
        if (m.length > 1 && m[0].type === m[m.length - 1].type) {
            m[m.length - 1].end = m[0].end;
            m.shift();
        }
        return m;
    }

    function reset() { rings = []; nextFloor = 0; nextDepth = 2.0; }

    function update(ballDepth) {
        while (nextDepth < ballDepth + GENERATE_AHEAD * RING_SPACING) {
            rings.push(generateRing(nextFloor, nextDepth));
            nextFloor++;
            nextDepth += RING_SPACING;
        }
        while (rings.length > 0 && rings[0].depth < ballDepth - REMOVE_BEHIND * RING_SPACING) {
            rings.shift();
        }
    }

    function getRings() { return rings; }

    function checkSegment(ring, ballAngle) {
        ballAngle = ((ballAngle % PI2) + PI2) % PI2;
        for (var i = 0; i < ring.segments.length; i++) {
            var s = ring.segments[i];
            if (inRange(ballAngle, s.start, s.end)) return s.type;
        }
        return SEG_SAFE;
    }

    return {
        SEG_SAFE: SEG_SAFE, SEG_GAP: SEG_GAP, SEG_DANGER: SEG_DANGER,
        RING_SPACING: RING_SPACING,
        reset: reset, update: update, getRings: getRings, checkSegment: checkSegment
    };
})();
