/**
 * Helix Descent — Pseudo-3D Renderer
 * Draws the tower, ball, particles, and UI effects on a Canvas 2D context.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Renderer = (function () {
    'use strict';

    var PI  = Math.PI;
    var PI2 = Math.PI * 2;

    var canvas, ctx;
    var W, H;  // canvas dimensions

    /* ---- Layout (recalculated on resize) ---- */
    var centerX, anchorY;
    var towerRX, towerRY, innerRX, innerRY;
    var ballRadius, ringThickness, depthScale;
    var PERSPECTIVE = 0.38;

    /* ---- Particles ---- */
    var particles = [];
    var MAX_PARTICLES = 180;

    /* ---- Score popups ---- */
    var popups = [];

    /* ---- Screen shake ---- */
    var shakeTimer = 0;
    var shakeIntensity = 0;

    /* ---- Camera ---- */
    var cameraDepth = 0;
    var cameraSmoothing = 8;

    function init(canvasEl) {
        canvas = canvasEl;
        ctx = canvas.getContext('2d');
        resize();
    }

    function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        centerX = W / 2;
        anchorY = H * 0.30;
        towerRX = W * 0.34;
        towerRY = towerRX * PERSPECTIVE;
        innerRX = W * 0.055;
        innerRY = innerRX * PERSPECTIVE;
        ballRadius = W * 0.034;
        ringThickness = Math.max(6, H * 0.014);
        depthScale = H * 0.10;
    }

    /* ---- Coordinate helpers ---- */

    function depthToScreenY(depth) {
        return anchorY + (depth - cameraDepth) * depthScale;
    }

    /** Update camera to follow ball. */
    function updateCamera(ballDepth, dt) {
        cameraDepth += (ballDepth - cameraDepth) * cameraSmoothing * dt;
    }

    function resetCamera(depth) { cameraDepth = depth; }

    /* ---- Drawing utilities ---- */

    function drawEllipticalArc(cx, cy, rx, ry, startA, endA, ccw) {
        ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, startA, endA, ccw || false);
    }

    /** Draw a donut-slice (ring segment). */
    function drawSegment(cy, oRX, oRY, iRX, iRY, startA, endA, color) {
        ctx.beginPath();
        drawEllipticalArc(centerX, cy, oRX, oRY, startA, endA, false);
        drawEllipticalArc(centerX, cy, iRX, iRY, endA, startA, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    /** Draw side-face band for outer edge of a segment. */
    function drawSideFace(cy, oRX, oRY, startA, endA, color, thickness) {
        ctx.beginPath();
        drawEllipticalArc(centerX, cy, oRX, oRY, startA, endA, false);
        drawEllipticalArc(centerX, cy + thickness, oRX, oRY, endA, startA, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    /* ---- Split arcs into front / back halves ---- */

    /**
     * Given a segment [startA, endA] (may wrap), split into
     * front arcs (screen angles [0, PI]) and back arcs ([PI, 2PI]).
     * Returns { front: [[s,e],...], back: [[s,e],...] }
     */
    function splitFrontBack(startA, endA) {
        // Normalize to [0, 2PI)
        startA = ((startA % PI2) + PI2) % PI2;
        endA   = ((endA   % PI2) + PI2) % PI2;

        // Expand arc into non-wrapping sub-arcs
        var arcs = [];
        if (endA > startA + 0.001) {
            arcs.push([startA, endA]);
        } else if (Math.abs(endA - startA) < 0.001) {
            // zero-length, skip
        } else {
            // wraps around 0
            if (startA < PI2 - 0.001) arcs.push([startA, PI2]);
            if (endA > 0.001) arcs.push([0, endA]);
        }

        var front = [], back = [];
        for (var i = 0; i < arcs.length; i++) {
            var a = arcs[i][0], b = arcs[i][1];
            // Clip to [0, PI]
            var fa = Math.max(a, 0), fb = Math.min(b, PI);
            if (fb - fa > 0.001) front.push([fa, fb]);
            // Clip to [PI, 2PI]
            var ba = Math.max(a, PI), bb = Math.min(b, PI2);
            if (bb - ba > 0.001) back.push([ba, bb]);
        }
        return { front: front, back: back };
    }

    /* ---- Main render ---- */

    function render(theme, state, dt) {
        var Physics = HelixDescent.Physics;
        var Tower   = HelixDescent.Tower;
        var ball    = Physics.getBall();
        var tw      = Physics.getTower();
        var rings   = Tower.getRings();

        // Update camera
        updateCamera(ball.depth, dt);

        // Screen shake offset
        var shakeX = 0, shakeY = 0;
        if (shakeTimer > 0) {
            shakeTimer -= dt;
            var t = Math.max(0, shakeTimer);
            var mag = shakeIntensity * (t / 0.3);
            shakeX = (Math.random() - 0.5) * mag * 2;
            shakeY = (Math.random() - 0.5) * mag * 2;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // ---- Background gradient ----
        var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, theme.bg1);
        bgGrad.addColorStop(1, theme.bg2);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-20, -20, W + 40, H + 40);

        // ---- Collect visible rings ----
        var visibleRings = [];
        for (var i = 0; i < rings.length; i++) {
            var ry = depthToScreenY(rings[i].depth);
            if (ry > -towerRY * 2 && ry < H + towerRY * 2) {
                visibleRings.push({ ring: rings[i], screenY: ry });
            }
        }

        // Sort top to bottom (back to front in depth)
        visibleRings.sort(function (a, b) { return a.screenY - b.screenY; });

        // ---- 1. Draw BACK halves of all rings ----
        for (var i = 0; i < visibleRings.length; i++) {
            drawRingHalf(visibleRings[i], tw.angle, theme, false);
        }

        // ---- 2. Draw central pillar ----
        drawPillar(theme);

        // ---- 3. Draw FRONT halves with thickness ----
        for (var i = 0; i < visibleRings.length; i++) {
            drawRingHalf(visibleRings[i], tw.angle, theme, true);
        }

        // ---- 4. Draw ball ----
        drawBall(ball, theme);

        // ---- 5. Particles ----
        updateAndDrawParticles(dt, theme);

        // ---- 6. Score popups ----
        updateAndDrawPopups(dt, theme);

        ctx.restore();
    }

    /* ---- Ring drawing ---- */

    function drawRingHalf(vr, towerAngle, theme, isFront) {
        var ring = vr.ring;
        var cy = vr.screenY;
        var segs = ring.segments;
        var Tower = HelixDescent.Tower;

        // Destroyed rings fade out
        var alpha = 1;
        if (ring.destroyed) {
            alpha = Math.max(0, 1 - ring.destroyTimer * 3);
            if (alpha <= 0) return;
        }

        ctx.globalAlpha = alpha;

        for (var j = 0; j < segs.length; j++) {
            var seg = segs[j];
            if (seg.type === Tower.SEG_GAP) continue;

            // Convert tower-local angles to screen angles
            var screenStart = seg.start + towerAngle;
            var screenEnd   = seg.end   + towerAngle;

            var split = splitFrontBack(screenStart, screenEnd);
            var arcs = isFront ? split.front : split.back;

            var color, sideColor;
            if (seg.type === Tower.SEG_DANGER) {
                color = (j % 2 === 0) ? theme.danger : theme.dangerAlt;
                sideColor = theme.dangerSide;
            } else {
                color = (j % 2 === 0) ? theme.platform : theme.platformAlt;
                sideColor = theme.platformSide;
            }

            for (var k = 0; k < arcs.length; k++) {
                var as = arcs[k][0], ae = arcs[k][1];

                if (isFront) {
                    // Side face first (below)
                    drawSideFace(cy, towerRX, towerRY, as, ae, sideColor, ringThickness);
                    // Inner side face
                    drawSideFace(cy, innerRX, innerRY, as, ae, sideColor, ringThickness);
                }

                // Top face
                drawSegment(cy, towerRX, towerRY, innerRX, innerRY, as, ae, color);

                // Neon glow effect
                if (theme.glow && seg.type !== Tower.SEG_DANGER) {
                    ctx.shadowColor = theme.platform;
                    ctx.shadowBlur = 10;
                    drawSegment(cy, towerRX, towerRY, innerRX, innerRY, as, ae, color);
                    ctx.shadowBlur = 0;
                }
            }
        }

        ctx.globalAlpha = 1;
    }

    /* ---- Pillar ---- */

    function drawPillar(theme) {
        var grad = ctx.createLinearGradient(centerX - innerRX, 0, centerX + innerRX, 0);
        grad.addColorStop(0, theme.pillar1);
        grad.addColorStop(0.5, theme.pillar2);
        grad.addColorStop(1, theme.pillar1);
        ctx.fillStyle = grad;
        ctx.fillRect(centerX - innerRX, 0, innerRX * 2, H);
    }

    /* ---- Ball ---- */

    function drawBall(ball, theme) {
        var bx = centerX;
        var by = depthToScreenY(ball.depth) + towerRY;

        // Squash/stretch
        var scaleX = 1 + ball.squash * 0.3;
        var scaleY = 1 - ball.squash * 0.3;

        // Shadow
        ctx.beginPath();
        var shadowY = by + ballRadius * 1.2;
        ctx.ellipse(bx, shadowY, ballRadius * scaleX * 1.1, ballRadius * 0.3, 0, 0, PI2);
        ctx.fillStyle = theme.ballShadow;
        ctx.fill();

        // Ball
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(scaleX, scaleY);
        ctx.beginPath();
        ctx.arc(0, 0, ballRadius, 0, PI2);
        ctx.fillStyle = theme.ball;
        ctx.fill();

        // Outline
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme.ballOutline;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(-ballRadius * 0.25, -ballRadius * 0.25, ballRadius * 0.35, 0, PI2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();

        ctx.restore();
    }

    /* ---- Particles ---- */

    function spawnParticle(x, y, vx, vy, color, life, size) {
        if (particles.length >= MAX_PARTICLES) {
            // Reuse oldest
            var p = particles.shift();
            p.x = x; p.y = y; p.vx = vx; p.vy = vy;
            p.color = color; p.life = life; p.maxLife = life; p.size = size || 3;
            particles.push(p);
        } else {
            particles.push({
                x: x, y: y, vx: vx, vy: vy,
                color: color, life: life, maxLife: life, size: size || 3
            });
        }
    }

    function spawnBounceParticles(depth, theme) {
        var bx = centerX;
        var by = depthToScreenY(depth) + towerRY;
        var colors = theme.particles;
        for (var i = 0; i < 12; i++) {
            var angle = PI2 * Math.random();
            var speed = 40 + Math.random() * 80;
            var c = colors[Math.floor(Math.random() * colors.length)];
            spawnParticle(bx, by, Math.cos(angle) * speed, Math.sin(angle) * speed - 30,
                          c, 0.4 + Math.random() * 0.3, 2 + Math.random() * 3);
        }
    }

    function spawnCrashParticles(depth, theme) {
        var bx = centerX;
        var by = depthToScreenY(depth) + towerRY;
        var colors = theme.dangerParticles;
        for (var i = 0; i < 30; i++) {
            var angle = PI2 * Math.random();
            var speed = 60 + Math.random() * 150;
            var c = colors[Math.floor(Math.random() * colors.length)];
            spawnParticle(bx, by, Math.cos(angle) * speed, Math.sin(angle) * speed - 50,
                          c, 0.5 + Math.random() * 0.5, 3 + Math.random() * 4);
        }
    }

    function spawnTrailParticle(depth, theme) {
        var bx = centerX + (Math.random() - 0.5) * ballRadius;
        var by = depthToScreenY(depth) + towerRY - ballRadius;
        var colors = theme.particles;
        var c = colors[Math.floor(Math.random() * colors.length)];
        spawnParticle(bx, by, (Math.random() - 0.5) * 10, -20 - Math.random() * 20,
                      c, 0.2 + Math.random() * 0.15, 1.5 + Math.random() * 1.5);
    }

    function updateAndDrawParticles(dt, theme) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.life -= dt;
            if (p.life <= 0) { particles.splice(i, 1); continue; }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // gravity on particles

            var alpha = Math.max(0, p.life / p.maxLife);
            var sz = p.size * alpha;

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz, 0, PI2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /* ---- Score Popups ---- */

    function spawnPopup(text, depth, color) {
        var by = depthToScreenY(depth) + towerRY;
        popups.push({
            text: text,
            x: centerX,
            y: by,
            life: 1.0,
            color: color || '#ffffff'
        });
    }

    function updateAndDrawPopups(dt) {
        for (var i = popups.length - 1; i >= 0; i--) {
            var p = popups[i];
            p.life -= dt;
            if (p.life <= 0) { popups.splice(i, 1); continue; }

            p.y -= 50 * dt;
            var alpha = Math.min(1, p.life * 2);
            var scale = 1 + (1 - p.life) * 0.3;

            ctx.globalAlpha = alpha;
            ctx.font = 'bold ' + Math.round(16 * scale) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, p.x, p.y);
        }
        ctx.globalAlpha = 1;
    }

    /* ---- Screen Shake ---- */

    function triggerShake(intensity, duration) {
        shakeIntensity = intensity || 12;
        shakeTimer = duration || 0.3;
    }

    /* ---- Cleanup ---- */

    function clearEffects() {
        particles = [];
        popups = [];
        shakeTimer = 0;
    }

    return {
        init: init,
        resize: resize,
        render: render,
        resetCamera: resetCamera,
        triggerShake: triggerShake,
        clearEffects: clearEffects,
        spawnBounceParticles: spawnBounceParticles,
        spawnCrashParticles: spawnCrashParticles,
        spawnTrailParticle: spawnTrailParticle,
        spawnPopup: spawnPopup,
        getCanvasSize: function () { return { w: W, h: H }; }
    };
})();
