/**
 * Helix Descent — Pseudo-3D Renderer (REWRITE)
 * Perspective scaling, correct z-ordering, thick platforms.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Renderer = (function () {
    'use strict';

    var PI = Math.PI, PI2 = Math.PI * 2;
    var canvas, ctx, W, H;

    /* Layout — recalculated on resize */
    var centerX, anchorY;
    var baseRX, baseRY, innerRX, innerRY;
    var ballR, platH, depthS, perspS;
    var BALL_OFF = 0.55; // ball Y offset ratio of baseRY

    /* Effects */
    var particles = [], MAX_P = 200;
    var popups = [];
    var shakeT = 0, shakeI = 0;
    var camDepth = 0, camSmooth = 6;

    /* ---- Init / Resize ---- */

    function init(el) { canvas = el; ctx = el.getContext('2d'); resize(); }

    function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        centerX = W / 2;
        anchorY = H * 0.28;
        baseRX = W * 0.36;
        baseRY = baseRX * 0.38;
        innerRX = W * 0.06;
        innerRY = innerRX * 0.38;
        ballR = Math.max(8, W * 0.032);
        platH = Math.max(14, H * 0.028);
        depthS = H * 0.095;
        perspS = 0.00018;
    }

    /* ---- Helpers ---- */

    function dToY(d) { return anchorY + (d - camDepth) * depthS; }
    function ps(sy) { return Math.max(0.7, Math.min(1.15, 1 - (sy - anchorY) * perspS)); }

    function drawDonut(cy, oRX, oRY, iRX, iRY, sa, ea, col) {
        ctx.beginPath();
        ctx.ellipse(centerX, cy, Math.max(0.1, oRX), Math.max(0.1, oRY), 0, sa, ea, false);
        ctx.ellipse(centerX, cy, Math.max(0.1, iRX), Math.max(0.1, iRY), 0, ea, sa, true);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
    }

    function drawBand(cy, rx, ry, sa, ea, col, h) {
        ctx.beginPath();
        ctx.ellipse(centerX, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, sa, ea, false);
        ctx.ellipse(centerX, cy + h, Math.max(0.1, rx), Math.max(0.1, ry), 0, ea, sa, true);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
    }

    /* ---- Split arc into front / back ---- */

    function splitFB(sa, ea) {
        sa = ((sa % PI2) + PI2) % PI2;
        ea = ((ea % PI2) + PI2) % PI2;
        var arcs = [];
        if (ea > sa + 0.001) arcs.push([sa, ea]);
        else if (Math.abs(ea - sa) < 0.001) { /* zero */ }
        else {
            if (sa < PI2 - 0.001) arcs.push([sa, PI2]);
            if (ea > 0.001) arcs.push([0, ea]);
        }
        var front = [], back = [];
        for (var i = 0; i < arcs.length; i++) {
            var a = arcs[i][0], b = arcs[i][1];
            var f1 = Math.max(a, 0), f2 = Math.min(b, PI);
            if (f2 - f1 > 0.001) front.push([f1, f2]);
            var b1 = Math.max(a, PI), b2 = Math.min(b, PI2);
            if (b2 - b1 > 0.001) back.push([b1, b2]);
        }
        return { front: front, back: back };
    }

    /* ---- Ring drawing ---- */

    function drawRingHalf(vr, tAngle, theme, isFront) {
        var ring = vr.ring, cy = vr.sy;
        var T = HelixDescent.Tower;
        var s = ps(cy);
        var oRX = baseRX * s, oRY = baseRY * s;
        var iRX = innerRX * s, iRY = innerRY * s;

        var segs = ring.segments;
        for (var j = 0; j < segs.length; j++) {
            var seg = segs[j];
            if (seg.type === T.SEG_GAP) continue;

            var sa = seg.start + tAngle, ea = seg.end + tAngle;
            var sp = splitFB(sa, ea);
            var arcs = isFront ? sp.front : sp.back;
            if (!arcs.length) continue;

            var col, sCol;
            if (seg.type === T.SEG_DANGER) {
                col = (j & 1) ? theme.dangerAlt : theme.danger;
                sCol = (j & 1) ? theme.dangerAltSide : theme.dangerSide;
            } else {
                col = (j & 1) ? theme.platformAlt : theme.platform;
                sCol = (j & 1) ? theme.platformAltSide : theme.platformSide;
            }

            for (var k = 0; k < arcs.length; k++) {
                var a = arcs[k][0], b = arcs[k][1];
                if (isFront) {
                    // Side faces (thickness bands) — outer and inner edges
                    drawBand(cy, oRX, oRY, a, b, sCol, platH);
                    drawBand(cy, iRX, iRY, a, b, sCol, platH);
                }
                // Top face
                drawDonut(cy, oRX, oRY, iRX, iRY, a, b, col);

                if (theme.glow && seg.type !== T.SEG_DANGER) {
                    ctx.shadowColor = col; ctx.shadowBlur = 8;
                    drawDonut(cy, oRX, oRY, iRX, iRY, a, b, col);
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    /* ---- Pillar ---- */

    function drawPillar(theme) {
        var s1 = ps(0), s2 = ps(H);
        var w1 = innerRX * s1, w2 = innerRX * s2;
        // Trapezoidal pillar (wider at top, narrower at bottom for perspective)
        ctx.beginPath();
        ctx.moveTo(centerX - w1, 0);
        ctx.lineTo(centerX + w1, 0);
        ctx.lineTo(centerX + w2, H);
        ctx.lineTo(centerX - w2, H);
        ctx.closePath();
        var gr = ctx.createLinearGradient(centerX - innerRX, 0, centerX + innerRX, 0);
        gr.addColorStop(0, theme.pillar1);
        gr.addColorStop(0.5, theme.pillar2);
        gr.addColorStop(1, theme.pillar1);
        ctx.fillStyle = gr;
        ctx.fill();
    }

    /* ---- Ball ---- */

    function drawBall(ball, bsy, theme) {
        var bx = centerX;

        // Shadow
        ctx.beginPath();
        ctx.ellipse(bx, bsy + ballR * 1.3, ballR * 1.1, ballR * 0.28, 0, 0, PI2);
        ctx.fillStyle = theme.ballShadow;
        ctx.fill();

        // Squash/stretch
        var scX = 1 + ball.squash * 0.3;
        var scY = 1 - ball.squash * 0.3;

        ctx.save();
        ctx.translate(bx, bsy);
        ctx.scale(scX, scY);

        // Main circle
        ctx.beginPath();
        ctx.arc(0, 0, ballR, 0, PI2);
        ctx.fillStyle = theme.ball;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme.ballOutline;
        ctx.stroke();

        // Highlight for sphere illusion
        ctx.beginPath();
        ctx.arc(-ballR * 0.22, -ballR * 0.22, ballR * 0.32, 0, PI2);
        ctx.fillStyle = theme.ballHighlight;
        ctx.fill();

        ctx.restore();
    }

    /* ---- Main render ---- */

    function render(theme, state, dt) {
        var Phys = HelixDescent.Physics;
        var Tow = HelixDescent.Tower;
        var ball = Phys.getBall();
        var tw = Phys.getTower();
        var rings = Tow.getRings();

        // Camera follow
        camDepth += (ball.depth - camDepth) * camSmooth * dt;

        // Shake
        var sx = 0, sy = 0;
        if (shakeT > 0) {
            shakeT -= dt;
            var mag = shakeI * Math.max(0, shakeT / 0.35);
            sx = (Math.random() - 0.5) * mag * 2;
            sy = (Math.random() - 0.5) * mag * 2;
        }

        ctx.save();
        ctx.translate(sx, sy);

        // Background
        var bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, theme.bg1); bg.addColorStop(1, theme.bg2);
        ctx.fillStyle = bg;
        ctx.fillRect(-20, -20, W + 40, H + 40);

        // Collect visible rings
        var vis = [];
        for (var i = 0; i < rings.length; i++) {
            var ry = dToY(rings[i].depth);
            if (ry > -baseRY * 3 && ry < H + baseRY * 2 + platH) {
                vis.push({ ring: rings[i], sy: ry });
            }
        }
        vis.sort(function (a, b) { return a.sy - b.sy; });

        // Ball screen Y
        var ballSY = dToY(ball.depth) + baseRY * BALL_OFF;

        // === Z-ordered rendering ===

        // 1. All BACK halves (top to bottom)
        for (var i = 0; i < vis.length; i++) {
            drawRingHalf(vis[i], tw.angle, theme, false);
        }

        // 2. Center pillar
        drawPillar(theme);

        // 3. FRONT halves of rings BELOW the ball (further from camera → draw first)
        for (var i = vis.length - 1; i >= 0; i--) {
            if (vis[i].sy > ballSY) {
                drawRingHalf(vis[i], tw.angle, theme, true);
            }
        }

        // 4. The ball
        drawBall(ball, ballSY, theme);

        // 5. FRONT halves of rings ABOVE/AT the ball (closer to camera → occlude ball)
        for (var i = vis.length - 1; i >= 0; i--) {
            if (vis[i].sy <= ballSY) {
                drawRingHalf(vis[i], tw.angle, theme, true);
            }
        }

        // 6. Particles & popups
        updateDrawParticles(dt);
        updateDrawPopups(dt);

        ctx.restore();
    }

    /* ---- Particles ---- */

    function spawnP(x, y, vx, vy, col, life, sz) {
        var p = { x:x, y:y, vx:vx, vy:vy, col:col, life:life, ml:life, sz:sz||3 };
        if (particles.length >= MAX_P) particles[particles.length - 1] = p;
        else particles.push(p);
    }

    function spawnBounceParticles(depth, theme) {
        var bx = centerX, by = dToY(depth) + baseRY * BALL_OFF;
        var cols = theme.particles;
        for (var i = 0; i < 10; i++) {
            var a = PI2 * Math.random(), sp = 40 + Math.random() * 70;
            spawnP(bx, by, Math.cos(a)*sp, Math.sin(a)*sp - 25,
                   cols[Math.floor(Math.random()*cols.length)], 0.4 + Math.random()*0.25, 2+Math.random()*2.5);
        }
    }

    function spawnCrashParticles(depth, theme) {
        var bx = centerX, by = dToY(depth) + baseRY * BALL_OFF;
        var cols = theme.dangerParticles;
        for (var i = 0; i < 25; i++) {
            var a = PI2 * Math.random(), sp = 50 + Math.random() * 130;
            spawnP(bx, by, Math.cos(a)*sp, Math.sin(a)*sp - 40,
                   cols[Math.floor(Math.random()*cols.length)], 0.5+Math.random()*0.4, 3+Math.random()*3.5);
        }
    }

    function spawnTrailParticle(depth, theme) {
        var bx = centerX + (Math.random()-0.5)*ballR;
        var by = dToY(depth) + baseRY * BALL_OFF - ballR;
        var cols = theme.particles;
        spawnP(bx, by, (Math.random()-0.5)*8, -18 - Math.random()*15,
               cols[Math.floor(Math.random()*cols.length)], 0.2+Math.random()*0.12, 1.5+Math.random()*1.2);
    }

    function updateDrawParticles(dt) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.life -= dt;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt;
            var al = Math.max(0, p.life / p.ml);
            ctx.globalAlpha = al;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.sz * al, 0, PI2);
            ctx.fillStyle = p.col;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /* ---- Score Popups ---- */

    function spawnPopup(text, depth, col) {
        popups.push({ text:text, x:centerX, y:dToY(depth)+baseRY*BALL_OFF, life:1.0, col:col||'#fff' });
    }

    function updateDrawPopups(dt) {
        for (var i = popups.length - 1; i >= 0; i--) {
            var p = popups[i];
            p.life -= dt;
            if (p.life <= 0) { popups.splice(i, 1); continue; }
            p.y -= 45 * dt;
            var al = Math.min(1, p.life * 2);
            var sc = 1 + (1 - p.life) * 0.25;
            ctx.globalAlpha = al;
            ctx.font = 'bold ' + Math.round(15 * sc) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = p.col;
            ctx.fillText(p.text, p.x, p.y);
        }
        ctx.globalAlpha = 1;
    }

    /* ---- Effects ---- */

    function triggerShake(intensity, dur) { shakeI = intensity || 14; shakeT = dur || 0.35; }
    function clearEffects() { particles = []; popups = []; shakeT = 0; }
    function resetCamera(d) { camDepth = d; }

    return {
        init: init, resize: resize, render: render,
        resetCamera: resetCamera, triggerShake: triggerShake, clearEffects: clearEffects,
        spawnBounceParticles: spawnBounceParticles,
        spawnCrashParticles: spawnCrashParticles,
        spawnTrailParticle: spawnTrailParticle,
        spawnPopup: spawnPopup
    };
})();
