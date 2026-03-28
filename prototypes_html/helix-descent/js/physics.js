/**
 * Helix Descent — Ball Physics & Collision
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Physics = (function () {
    'use strict';

    var PI2 = Math.PI * 2;

    /* Tuned constants */
    var GRAVITY          = 9.0;
    var MIN_BOUNCE_VEL   = 2.8;
    var BOUNCE_DAMPING   = 0.50;
    var MAX_FALL_SPEED   = 18.0;
    var ROT_FRICTION     = 0.06;
    var ROT_DRAG_FRIC    = 0.14;

    var ball = { depth: 0, prevDepth: 0, velocityY: 0, squash: 0 };
    var tower = { angle: 0, angularVel: 0 };

    var combo = 0, maxCombo = 0, floorsCleared = 0, speedMul = 1.0;

    var onBounce = null, onFallThrough = null, onCrash = null, onNearMiss = null;

    function setCallbacks(cbs) {
        onBounce = cbs.onBounce || null;
        onFallThrough = cbs.onFallThrough || null;
        onCrash = cbs.onCrash || null;
        onNearMiss = cbs.onNearMiss || null;
    }

    function reset() {
        ball.depth = 0; ball.prevDepth = 0; ball.velocityY = 0; ball.squash = 0;
        tower.angle = 0; tower.angularVel = 0;
        combo = 0; maxCombo = 0; floorsCleared = 0; speedMul = 1.0;
    }

    function updateSpeed() {
        speedMul = Math.min(2.5, 1.0 + floorsCleared * 0.005);
    }

    function step(dt, inputForce, isDrag) {
        var Tower = HelixDescent.Tower;

        /* Tower rotation */
        var fric = isDrag ? ROT_DRAG_FRIC : ROT_FRICTION;
        tower.angularVel += inputForce * dt;
        tower.angularVel *= Math.pow(1 - fric, dt * 60);
        if (Math.abs(tower.angularVel) < 0.0008) tower.angularVel = 0;
        tower.angle += tower.angularVel * dt;
        tower.angle = ((tower.angle % PI2) + PI2) % PI2;

        /* Ball gravity */
        ball.prevDepth = ball.depth;
        var g = GRAVITY * speedMul;
        ball.velocityY += g * dt;
        var maxV = MAX_FALL_SPEED * speedMul;
        if (ball.velocityY > maxV) ball.velocityY = maxV;
        ball.depth += ball.velocityY * dt;

        /* Squash/stretch decay */
        ball.squash *= Math.pow(0.04, dt);
        if (Math.abs(ball.squash) < 0.01) ball.squash = 0;
        if (ball.velocityY > 3.5) {
            ball.squash = Math.min(0.4, ball.velocityY / maxV * 0.45);
        }

        /* Collision */
        if (ball.velocityY > 0) {
            var rings = Tower.getRings();
            for (var i = 0; i < rings.length; i++) {
                var ring = rings[i];
                if (ring.passed) continue;

                if (ball.prevDepth < ring.depth && ball.depth >= ring.depth) {
                    var ba = getBallTowerAngle();
                    var seg = Tower.checkSegment(ring, ba);

                    if (seg === Tower.SEG_GAP) {
                        ring.passed = true;
                        combo++;
                        if (combo > maxCombo) maxCombo = combo;
                        floorsCleared++;
                        updateSpeed();
                        if (onFallThrough) onFallThrough(ring, combo);
                        checkNearMiss(ring, ba);

                    } else if (seg === Tower.SEG_DANGER) {
                        ball.depth = ring.depth - 0.01;
                        ball.velocityY = 0;
                        if (onCrash) onCrash(ring);
                        return 'crash';

                    } else {
                        /* Bounce on safe platform */
                        ball.depth = ring.depth - 0.01;
                        var bv = Math.max(MIN_BOUNCE_VEL, Math.abs(ball.velocityY) * BOUNCE_DAMPING);
                        ball.velocityY = -bv;
                        ball.squash = -0.5;
                        var prevC = combo;
                        combo = 0;
                        if (onBounce) onBounce(ring, prevC);
                        checkNearMissDanger(ring, ba);
                        break;
                    }
                }
            }
        }

        return 'ok';
    }

    function checkNearMiss(ring, ba) {
        var T = HelixDescent.Tower, NM = 0.15;
        for (var i = 0; i < ring.segments.length; i++) {
            var s = ring.segments[i];
            if (s.type === T.SEG_DANGER) {
                if (angleDist(ba, s.start) < NM || angleDist(ba, s.end) < NM) {
                    if (onNearMiss) onNearMiss();
                    return;
                }
            }
        }
    }

    function checkNearMissDanger(ring, ba) {
        var T = HelixDescent.Tower, NM = 0.2;
        for (var i = 0; i < ring.segments.length; i++) {
            var s = ring.segments[i];
            if (s.type === T.SEG_DANGER) {
                if (angleDist(ba, s.start) < NM || angleDist(ba, s.end) < NM) {
                    if (onNearMiss) onNearMiss();
                    return;
                }
            }
        }
    }

    function angleDist(a, b) {
        var d = Math.abs(((a - b) % PI2 + PI2) % PI2);
        return Math.min(d, PI2 - d);
    }

    function getBallTowerAngle() {
        return ((Math.PI / 2 - tower.angle) % PI2 + PI2) % PI2;
    }

    return {
        reset: reset, step: step, setCallbacks: setCallbacks,
        getBall: function () { return ball; },
        getTower: function () { return tower; },
        getBallTowerAngle: getBallTowerAngle,
        getCombo: function () { return combo; },
        getFloorsCleared: function () { return floorsCleared; },
        getSpeedMultiplier: function () { return speedMul; }
    };
})();
