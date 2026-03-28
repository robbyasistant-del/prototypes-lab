/**
 * Helix Descent — Game Loop & State Machine (REWRITE)
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Game = (function () {
    'use strict';

    var STATE_MENU = 0, STATE_PLAYING = 1, STATE_GAMEOVER = 2;
    var state = STATE_MENU;
    var score = 0, bestScore = 0, lastThemeIdx = -1;
    var goTimer = 0, trailTimer = 0;

    /* Fixed timestep */
    var PH_DT = 1 / 120, accum = 0, lastT = 0;
    var running = false;

    /* DOM */
    var canvas, scoreEl, bestEl, comboEl;
    var menuOv, goOv, goScoreEl, goBestEl, muteBtn;

    function init() {
        canvas    = document.getElementById('game-canvas');
        scoreEl   = document.getElementById('score');
        bestEl    = document.getElementById('best-score');
        comboEl   = document.getElementById('combo');
        menuOv    = document.getElementById('menu-overlay');
        goOv      = document.getElementById('gameover-overlay');
        goScoreEl = document.getElementById('go-score');
        goBestEl  = document.getElementById('go-best');
        muteBtn   = document.getElementById('mute-btn');

        try { bestScore = parseInt(localStorage.getItem('helix_best') || '0', 10); } catch(e) { bestScore = 0; }
        if (bestEl) bestEl.textContent = bestScore;

        HelixDescent.Renderer.init(canvas);
        HelixDescent.Audio.init();
        HelixDescent.Input.init(canvas, onTap);
        HelixDescent.Physics.setCallbacks({
            onBounce: onBounce,
            onFallThrough: onFallThrough,
            onCrash: onCrash,
            onNearMiss: onNearMiss
        });

        if (muteBtn) {
            muteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                muteBtn.textContent = HelixDescent.Audio.toggleMute() ? '🔇' : '🔊';
            });
        }

        window.addEventListener('resize', function () { HelixDescent.Renderer.resize(); });

        showMenu();
        running = true;
        lastT = performance.now();
        requestAnimationFrame(loop);
    }

    /* ---- Loop ---- */

    function loop(ts) {
        if (!running) return;
        requestAnimationFrame(loop);

        var dt = Math.min((ts - lastT) / 1000, 0.05);
        lastT = ts;

        var P = HelixDescent.Physics, T = HelixDescent.Tower;
        var I = HelixDescent.Input, R = HelixDescent.Renderer;
        var Th = HelixDescent.Themes;

        if (state === STATE_PLAYING) {
            accum += dt;
            while (accum >= PH_DT) {
                var res = P.step(PH_DT, I.getAngularForce(), I.isDragging());
                accum -= PH_DT;
                if (res === 'crash') { triggerGameOver(); accum = 0; break; }
            }

            T.update(P.getBall().depth);

            // Trail particles
            if (P.getBall().velocityY > 3.5) {
                trailTimer += dt;
                if (trailTimer > 0.035) {
                    trailTimer = 0;
                    R.spawnTrailParticle(P.getBall().depth, Th.getTheme(P.getFloorsCleared()));
                }
            }

            checkThemeTransition();
            scoreEl.textContent = score;
            updateCombo();
        } else if (state === STATE_GAMEOVER) {
            goTimer += dt;
        }

        var theme = Th.getTheme(
            (state === STATE_PLAYING || state === STATE_GAMEOVER) ? P.getFloorsCleared() : 0
        );
        R.render(theme, state, dt);
    }

    /* ---- States ---- */

    function showMenu() {
        state = STATE_MENU;
        menuOv.classList.remove('hidden');
        goOv.classList.add('hidden');
        scoreEl.parentElement.classList.add('hidden');
        comboEl.classList.add('hidden');
        HelixDescent.Physics.reset();
        HelixDescent.Tower.reset();
        HelixDescent.Tower.update(0);
        HelixDescent.Renderer.resetCamera(0);
        HelixDescent.Renderer.clearEffects();
    }

    function startGame() {
        state = STATE_PLAYING;
        score = 0; lastThemeIdx = -1; trailTimer = 0;
        menuOv.classList.add('hidden');
        goOv.classList.add('hidden');
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
        goTimer = 0;
        var theme = HelixDescent.Themes.getTheme(HelixDescent.Physics.getFloorsCleared());
        HelixDescent.Audio.playCrash();
        HelixDescent.Renderer.triggerShake(16, 0.38);
        HelixDescent.Renderer.spawnCrashParticles(HelixDescent.Physics.getBall().depth, theme);

        if (score > bestScore) {
            bestScore = score;
            try { localStorage.setItem('helix_best', String(bestScore)); } catch(e) {}
        }
        if (bestEl) bestEl.textContent = bestScore;

        setTimeout(function () {
            goScoreEl.textContent = score;
            goBestEl.textContent = bestScore;
            goOv.classList.remove('hidden');
            scoreEl.parentElement.classList.add('hidden');
            comboEl.classList.add('hidden');
        }, 250);
    }

    function onTap() {
        HelixDescent.Audio.resume();
        if (state === STATE_MENU) startGame();
        else if (state === STATE_GAMEOVER && goTimer > 0.4) startGame();
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
        HelixDescent.Audio.playScoreTick(combo);

        var txt = '+1';
        if (combo >= 3) txt = '+1 x' + combo;
        HelixDescent.Renderer.spawnPopup(txt, ring.depth, theme.scoreColor);

        if (combo === 3 || combo === 5 || combo === 8 || combo >= 10 && combo % 5 === 0) {
            HelixDescent.Audio.playCombo(combo);
        }
        if (combo > 1) score += Math.floor(combo / 3);
    }

    function onCrash() { /* handled in triggerGameOver */ }

    function onNearMiss() {
        HelixDescent.Audio.playNearMiss();
        var theme = HelixDescent.Themes.getTheme(HelixDescent.Physics.getFloorsCleared());
        var ball = HelixDescent.Physics.getBall();
        HelixDescent.Renderer.spawnPopup('CLOSE!', ball.depth, theme.comboColor);
    }

    function checkThemeTransition() {
        var fl = HelixDescent.Physics.getFloorsCleared();
        var idx = Math.floor(fl / HelixDescent.Themes.FLOORS_PER_THEME);
        if (idx !== lastThemeIdx && lastThemeIdx >= 0) {
            HelixDescent.Audio.playThemeTransition();
        }
        lastThemeIdx = idx;
    }

    function updateCombo() {
        var c = HelixDescent.Physics.getCombo();
        if (c >= 2) {
            comboEl.classList.remove('hidden');
            comboEl.textContent = 'x' + c;
            comboEl.style.transform = 'scale(' + Math.min(1.5, 1 + c * 0.04) + ')';
        } else {
            comboEl.classList.add('hidden');
        }
    }

    return { init: init };
})();

window.addEventListener('DOMContentLoaded', function () { HelixDescent.Game.init(); });
