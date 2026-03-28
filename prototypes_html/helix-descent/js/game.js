/**
 * Helix Descent — Main Game Loop & State Machine
 * Orchestrates all modules: physics, rendering, audio, input, tower, themes.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Game = (function () {
    'use strict';

    var STATE_MENU     = 0;
    var STATE_PLAYING  = 1;
    var STATE_GAMEOVER = 2;

    var state = STATE_MENU;
    var score = 0;
    var bestScore = 0;
    var lastThemeIndex = -1;
    var gameOverTimer = 0;
    var trailTimer = 0;

    /* ---- Fixed timestep ---- */
    var PHYSICS_DT = 1 / 120;
    var accumulator = 0;
    var lastTime = 0;
    var running = false;
    var rafId = null;

    /* ---- DOM refs ---- */
    var canvas, scoreEl, bestScoreEl, comboEl;
    var menuOverlay, gameOverOverlay, goScoreEl, goBestEl;
    var muteBtn;

    /* ---- Init ---- */

    function init() {
        canvas         = document.getElementById('game-canvas');
        scoreEl        = document.getElementById('score');
        bestScoreEl    = document.getElementById('best-score');
        comboEl        = document.getElementById('combo');
        menuOverlay    = document.getElementById('menu-overlay');
        gameOverOverlay= document.getElementById('gameover-overlay');
        goScoreEl      = document.getElementById('go-score');
        goBestEl       = document.getElementById('go-best');
        muteBtn        = document.getElementById('mute-btn');

        // Load best score
        try { bestScore = parseInt(localStorage.getItem('helix_best') || '0', 10); }
        catch(e) { bestScore = 0; }
        updateBestDisplay();

        // Init subsystems
        HelixDescent.Renderer.init(canvas);
        HelixDescent.Audio.init();
        HelixDescent.Input.init(canvas, onTap);

        // Physics callbacks
        HelixDescent.Physics.setCallbacks({
            onBounce: onBounce,
            onFallThrough: onFallThrough,
            onCrash: onCrash,
            onNearMiss: onNearMiss
        });

        // Mute button
        if (muteBtn) {
            muteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var m = HelixDescent.Audio.toggleMute();
                muteBtn.textContent = m ? '🔇' : '🔊';
            });
        }

        // Resize
        window.addEventListener('resize', function () {
            HelixDescent.Renderer.resize();
        });

        // Show menu
        showMenu();

        // Start loop
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    /* ---- Game loop ---- */

    function loop(timestamp) {
        if (!running) return;
        rafId = requestAnimationFrame(loop);

        var dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
        lastTime = timestamp;

        var Physics = HelixDescent.Physics;
        var Tower   = HelixDescent.Tower;
        var Input   = HelixDescent.Input;
        var Renderer = HelixDescent.Renderer;
        var Themes  = HelixDescent.Themes;

        if (state === STATE_PLAYING) {
            // Fixed physics timestep
            accumulator += dt;
            while (accumulator >= PHYSICS_DT) {
                var force = Input.getAngularForce();
                var result = Physics.step(PHYSICS_DT, force, Input.isDragging());
                accumulator -= PHYSICS_DT;

                if (result === 'crash') {
                    triggerGameOver();
                    accumulator = 0;
                    break;
                }
            }

            // Update tower generation
            Tower.update(Physics.getBall().depth);

            // Update ring destroy timers
            var rings = Tower.getRings();
            for (var i = 0; i < rings.length; i++) {
                if (rings[i].destroyed) {
                    rings[i].destroyTimer += dt;
                }
            }

            // Trail particles while falling fast
            if (Physics.getBall().velocityY > 3) {
                trailTimer += dt;
                if (trailTimer > 0.03) {
                    trailTimer = 0;
                    var theme = Themes.getTheme(Physics.getFloorsCleared());
                    Renderer.spawnTrailParticle(Physics.getBall().depth, theme);
                }
            }

            // Check theme transition
            checkThemeTransition();

            // Update score display
            scoreEl.textContent = score;
            updateComboDisplay();

        } else if (state === STATE_GAMEOVER) {
            gameOverTimer += dt;
        }

        // Render
        var theme = Themes.getTheme(
            state === STATE_PLAYING || state === STATE_GAMEOVER
                ? Physics.getFloorsCleared() : 0
        );
        Renderer.render(theme, state, dt);

        // Draw UI overlays on top of canvas
        drawCanvasUI(theme, dt);
    }

    /* ---- Canvas-based UI (score, combo on canvas) ---- */

    function drawCanvasUI(theme, dt) {
        // Additional canvas UI can go here if needed
        // Most UI is handled via DOM overlays for simplicity
    }

    /* ---- State transitions ---- */

    function showMenu() {
        state = STATE_MENU;
        menuOverlay.classList.remove('hidden');
        gameOverOverlay.classList.add('hidden');
        scoreEl.parentElement.classList.add('hidden');
        comboEl.classList.add('hidden');

        // Set up idle state
        HelixDescent.Physics.reset();
        HelixDescent.Tower.reset();
        HelixDescent.Tower.update(0);
        HelixDescent.Renderer.resetCamera(0);
        HelixDescent.Renderer.clearEffects();
    }

    function startGame() {
        state = STATE_PLAYING;
        score = 0;
        lastThemeIndex = -1;
        trailTimer = 0;

        menuOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        scoreEl.parentElement.classList.remove('hidden');
        scoreEl.textContent = '0';
        comboEl.classList.add('hidden');

        HelixDescent.Physics.reset();
        HelixDescent.Tower.reset();
        HelixDescent.Tower.update(0);
        HelixDescent.Renderer.resetCamera(0);
        HelixDescent.Renderer.clearEffects();
        HelixDescent.Audio.resume();
    }

    function triggerGameOver() {
        state = STATE_GAMEOVER;
        gameOverTimer = 0;

        var theme = HelixDescent.Themes.getTheme(HelixDescent.Physics.getFloorsCleared());

        // Effects
        HelixDescent.Audio.playCrash();
        HelixDescent.Renderer.triggerShake(15, 0.35);
        HelixDescent.Renderer.spawnCrashParticles(
            HelixDescent.Physics.getBall().depth, theme
        );

        // Update best
        if (score > bestScore) {
            bestScore = score;
            try { localStorage.setItem('helix_best', String(bestScore)); } catch(e) {}
        }

        // Show overlay after brief delay
        setTimeout(function () {
            goScoreEl.textContent = score;
            goBestEl.textContent = bestScore;
            gameOverOverlay.classList.remove('hidden');
            scoreEl.parentElement.classList.add('hidden');
            comboEl.classList.add('hidden');
        }, 250);
    }

    /* ---- Tap handler ---- */

    function onTap() {
        HelixDescent.Audio.resume();
        if (state === STATE_MENU) {
            startGame();
        } else if (state === STATE_GAMEOVER && gameOverTimer > 0.4) {
            startGame();
        }
    }

    /* ---- Physics callbacks ---- */

    function onBounce(ring, prevCombo) {
        var theme = HelixDescent.Themes.getTheme(HelixDescent.Physics.getFloorsCleared());
        HelixDescent.Audio.playBounce(HelixDescent.Physics.getSpeedMultiplier());
        HelixDescent.Renderer.spawnBounceParticles(ring.depth, theme);
    }

    function onFallThrough(ring, combo) {
        score++;
        var theme = HelixDescent.Themes.getTheme(HelixDescent.Physics.getFloorsCleared());

        // Score tick sound
        HelixDescent.Audio.playScoreTick(combo);

        // Score popup
        var text = '+1';
        if (combo >= 3) text = '+1 x' + combo;
        HelixDescent.Renderer.spawnPopup(text, ring.depth, theme.scorePopup);

        // Combo milestones
        if (combo === 3 || combo === 5 || combo === 8 || combo === 10 || combo % 5 === 0) {
            HelixDescent.Audio.playCombo(combo);
        }

        // Perfect drop (combo >= 3 floors without bouncing)
        if (combo >= 3) {
            HelixDescent.Audio.playPerfect();
            HelixDescent.Renderer.spawnPopup('PERFECT!', ring.depth - 0.3, theme.comboColor);
        }

        // Extra score for combos
        if (combo > 1) {
            score += Math.floor(combo / 2);
        }
    }

    function onCrash(ring) {
        // Handled in triggerGameOver
    }

    function onNearMiss() {
        HelixDescent.Audio.playNearMiss();
        var theme = HelixDescent.Themes.getTheme(HelixDescent.Physics.getFloorsCleared());
        var ball = HelixDescent.Physics.getBall();
        HelixDescent.Renderer.spawnPopup('CLOSE!', ball.depth, theme.danger);
    }

    /* ---- Theme transitions ---- */

    function checkThemeTransition() {
        var floor = HelixDescent.Physics.getFloorsCleared();
        var idx = Math.floor(floor / HelixDescent.Themes.FLOORS_PER_THEME);
        if (idx !== lastThemeIndex && lastThemeIndex >= 0) {
            HelixDescent.Audio.playThemeTransition();
        }
        lastThemeIndex = idx;
    }

    /* ---- UI helpers ---- */

    function updateBestDisplay() {
        if (bestScoreEl) bestScoreEl.textContent = bestScore;
    }

    function updateComboDisplay() {
        var c = HelixDescent.Physics.getCombo();
        if (c >= 2) {
            comboEl.classList.remove('hidden');
            comboEl.textContent = 'x' + c;
            comboEl.style.transform = 'scale(' + Math.min(1.5, 1 + c * 0.05) + ')';
        } else {
            comboEl.classList.add('hidden');
        }
    }

    return {
        init: init
    };
})();

/* ---- Bootstrap ---- */
window.addEventListener('DOMContentLoaded', function () {
    HelixDescent.Game.init();
});
