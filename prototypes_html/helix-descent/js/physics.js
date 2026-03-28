/**
 * Helix Descent — Ball Physics & Collision Detection
 * Gravity, bounce, tower rotation with momentum/inertia.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Physics = (function () {
    'use strict';

    var PI2 = Math.PI * 2;

    /* ---- Constants ---- */
    var GRAVITY          = 12.0;   // world-units/s²
    var MIN_BOUNCE_VEL   = 3.3;    // minimum upward velocity on bounce
    var BOUNCE_DAMPING   = 0.55;   // velocity retention on bounce
    var MAX_FALL_SPEED   = 20.0;   // terminal velocity
    var ROTATION_FRICTION = 0.08;  // angular friction coefficient (per second, exponential)
    var ROTATION_DRAG_FRICTION = 0.16; // stronger friction while dragging (more responsive)

    /* ---- State ---- */
    var ball = {
        depth: 0,
        prevDepth: 0,
        velocityY: 0,       // positive = falling
        squash: 0,          // -1 = squashed, +1 = stretched, decays to 0
        onRing: null,        // reference to ring the ball is sitting on
        airborne: false
    };

    var tower = {
        angle: 0,            // current rotation (radians)
        angularVel: 0        // radians/s
    };

    var combo = 0;           // consecutive floors passed without bouncing
    var maxCombo = 0;
    var floorsCleared = 0;
    var speedMultiplier = 1.0;
    var lastBounceDepth = 0;

    /* ---- Callbacks (set by game.js) ---- */
    var onBounce = null;     // function(ring, combo)
    var onFallThrough = null; // function(ring, combo)
    var onCrash = null;      // function(ring)
    var onNearMiss = null;   // function()

    function setCallbacks(cbs) {
        onBounce = cbs.onBounce || null;
        onFallThrough = cbs.onFallThrough || null;
        onCrash = cbs.onCrash || null;
        onNearMiss = cbs.onNearMiss || null;
    }

    /* ---- Reset ---- */

    function reset() {
        ball.depth = 0;
        ball.prevDepth = 0;
        ball.velocityY = 0;
        ball.squash = 0;
        ball.onRing = null;
        ball.airborne = true;
        tower.angle = 0;
        tower.angularVel = 0;
        combo = 0;
        maxCombo = 0;
        floorsCleared = 0;
        speedMultiplier = 1.0;
        lastBounceDepth = 0;
    }

    /* ---- Speed progression ---- */

    function updateSpeed() {
        // 1% faster per floor, capped at 3x
        speedMultiplier = Math.min(3.0, 1.0 + floorsCleared * 0.008);
    }

    /* ---- Physics step (call at fixed dt, e.g., 1/120s) ---- */

    function step(dt, inputForce, isDragging) {
        var Tower = HelixDescent.Tower;

        // ---- Tower rotation ----
        var friction = isDragging ? ROTATION_DRAG_FRICTION : ROTATION_FRICTION;
        tower.angularVel += inputForce * dt;
        tower.angularVel *= Math.pow(1 - friction, dt * 60);
        // Clamp angular velocity
        if (Math.abs(tower.angularVel) < 0.001) tower.angularVel = 0;
        tower.angle += tower.angularVel * dt;
        tower.angle = ((tower.angle % PI2) + PI2) % PI2;

        // ---- Ball gravity ----
        ball.prevDepth = ball.depth;
        var grav = GRAVITY * speedMultiplier;
        ball.velocityY += grav * dt;
        if (ball.velocityY > MAX_FALL_SPEED * speedMultiplier) {
            ball.velocityY = MAX_FALL_SPEED * speedMultiplier;
        }
        ball.depth += ball.velocityY * dt;

        // ---- Squash/stretch decay ----
        ball.squash *= Math.pow(0.05, dt); // rapid decay
        if (Math.abs(ball.squash) < 0.01) ball.squash = 0;
        // Stretch while falling fast
        if (ball.velocityY > 4) {
            ball.squash = Math.min(0.4, ball.velocityY / MAX_FALL_SPEED * 0.5);
        }

        // ---- Collision with rings ----
        if (ball.velocityY > 0) { // only check when falling
            var rings = Tower.getRings();
            for (var i = 0; i < rings.length; i++) {
                var ring = rings[i];
                if (ring.passed || ring.destroyed) continue;

                // Did ball cross this ring this step?
                if (ball.prevDepth < ring.depth && ball.depth >= ring.depth) {
                    var ballAngle = getBallTowerAngle();
                    var segType = Tower.checkSegment(ring, ballAngle);

                    if (segType === Tower.SEG_GAP) {
                        // Fall through — score!
                        ring.passed = true;
                        combo++;
                        if (combo > maxCombo) maxCombo = combo;
                        floorsCleared++;
                        updateSpeed();

                        // Trigger destroy animation
                        ring.destroyed = true;
                        ring.destroyTimer = 0;

                        if (onFallThrough) onFallThrough(ring, combo);

                        // Check near-miss (ball angle close to edge of gap)
                        checkNearMiss(ring, ballAngle);

                    } else if (segType === Tower.SEG_DANGER) {
                        // CRASH!
                        ball.depth = ring.depth - 0.01;
                        ball.velocityY = 0;
                        if (onCrash) onCrash(ring);
                        return 'crash';

                    } else {
                        // Safe platform — bounce!
                        ball.depth = ring.depth - 0.01;
                        var bounceVel = Math.max(MIN_BOUNCE_VEL,
                            Math.abs(ball.velocityY) * BOUNCE_DAMPING);
                        ball.velocityY = -bounceVel;
                        ball.squash = -0.5; // squash on impact
                        ball.onRing = ring;
                        ball.airborne = false;
                        lastBounceDepth = ring.depth;

                        var prevCombo = combo;
                        combo = 0;
                        if (onBounce) onBounce(ring, prevCombo);

                        // Check near-miss with danger zone
                        checkNearMissDanger(ring, ballAngle);
                        break; // stop checking further rings
                    }
                }
            }
        }

        // Mark ball as airborne if moving up
        if (ball.velocityY < -0.1) ball.airborne = true;

        return 'ok';
    }

    /* ---- Near-miss detection ---- */

    function checkNearMiss(ring, ballAngle) {
        var NEAR_MISS_ANGLE = 0.15; // ~8.6°
        for (var i = 0; i < ring.segments.length; i++) {
            var seg = ring.segments[i];
            if (seg.type === HelixDescent.Tower.SEG_DANGER) {
                var distToStart = angleDist(ballAngle, seg.start);
                var distToEnd = angleDist(ballAngle, seg.end);
                if (distToStart < NEAR_MISS_ANGLE || distToEnd < NEAR_MISS_ANGLE) {
                    if (onNearMiss) onNearMiss();
                    return;
                }
            }
        }
    }

    function checkNearMissDanger(ring, ballAngle) {
        var NEAR_MISS_ANGLE = 0.2;
        for (var i = 0; i < ring.segments.length; i++) {
            var seg = ring.segments[i];
            if (seg.type === HelixDescent.Tower.SEG_DANGER) {
                var distToStart = angleDist(ballAngle, seg.start);
                var distToEnd = angleDist(ballAngle, seg.end);
                if (distToStart < NEAR_MISS_ANGLE || distToEnd < NEAR_MISS_ANGLE) {
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

    /* ---- Queries ---- */

    function getBallTowerAngle() {
        // Ball is at screen front (angle π/2 in screen space).
        // Screen angle = towerLocal + tower.angle
        // π/2 = towerLocal + tower.angle
        // towerLocal = π/2 - tower.angle
        return ((Math.PI / 2 - tower.angle) % PI2 + PI2) % PI2;
    }

    function getBall() { return ball; }
    function getTower() { return tower; }
    function getCombo() { return combo; }
    function getMaxCombo() { return maxCombo; }
    function getFloorsCleared() { return floorsCleared; }
    function getSpeedMultiplier() { return speedMultiplier; }

    return {
        reset: reset,
        step: step,
        setCallbacks: setCallbacks,
        getBall: getBall,
        getTower: getTower,
        getBallTowerAngle: getBallTowerAngle,
        getCombo: getCombo,
        getMaxCombo: getMaxCombo,
        getFloorsCleared: getFloorsCleared,
        getSpeedMultiplier: getSpeedMultiplier
    };
})();
