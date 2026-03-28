/**
 * Helix Descent — Web Audio API Sound Synthesis
 * All sounds generated procedurally — no external audio files.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Audio = (function () {
    'use strict';

    var ctx = null;
    var masterGain = null;
    var muted = false;
    var volume = 0.5;

    function init() {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = volume;
            masterGain.connect(ctx.destination);
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }

    function resume() {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function setMuted(m) {
        muted = m;
        if (masterGain) masterGain.gain.value = muted ? 0 : volume;
    }

    function toggleMute() { setMuted(!muted); return muted; }
    function isMuted() { return muted; }

    /* ---- helpers ---- */

    function now() { return ctx ? ctx.currentTime : 0; }

    function osc(type, freq, startT, dur, gainVal, dest) {
        if (!ctx) return;
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(gainVal, startT);
        g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
        o.connect(g);
        g.connect(dest || masterGain);
        o.start(startT);
        o.stop(startT + dur);
    }

    function noise(startT, dur, gainVal, dest) {
        if (!ctx) return;
        var len = Math.ceil(ctx.sampleRate * dur);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        var src = ctx.createBufferSource();
        src.buffer = buf;
        var g = ctx.createGain();
        g.gain.setValueAtTime(gainVal, startT);
        g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
        src.connect(g);
        g.connect(dest || masterGain);
        src.start(startT);
        src.stop(startT + dur);
    }

    /* ---- sound effects ---- */

    /** Bounce pop — pitch varies with speed multiplier */
    function playBounce(speedMul) {
        if (!ctx) return;
        resume();
        var t = now();
        var baseFreq = 600 + Math.random() * 100;
        var freq = baseFreq * (0.8 + (speedMul || 1) * 0.2);
        osc('sine', freq, t, 0.08, 0.25);
        osc('sine', freq * 1.5, t, 0.05, 0.1);
        noise(t, 0.03, 0.06);
    }

    /** Crash — low rumble + high crack */
    function playCrash() {
        if (!ctx) return;
        resume();
        var t = now();
        // Low rumble
        osc('sawtooth', 60, t, 0.4, 0.3);
        osc('sine', 40, t, 0.5, 0.2);
        // Crack
        noise(t, 0.15, 0.35);
        osc('square', 200, t, 0.06, 0.2);
        osc('square', 150, t + 0.03, 0.08, 0.15);
    }

    /** Score tick — subtle ascending tone */
    function playScoreTick(combo) {
        if (!ctx) return;
        resume();
        var t = now();
        var freq = 800 + Math.min(combo || 0, 10) * 60;
        osc('sine', freq, t, 0.06, 0.12);
    }

    /** Combo milestone — excited ascending arpeggio */
    function playCombo(level) {
        if (!ctx) return;
        resume();
        var t = now();
        var base = 500 + Math.min(level, 8) * 80;
        osc('sine', base, t, 0.1, 0.18);
        osc('sine', base * 1.25, t + 0.06, 0.1, 0.15);
        osc('sine', base * 1.5, t + 0.12, 0.15, 0.12);
    }

    /** Theme transition — sweeping filter chord */
    function playThemeTransition() {
        if (!ctx) return;
        resume();
        var t = now();
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(4000, t + 1.0);
        filter.connect(masterGain);
        osc('sine', 330, t, 1.2, 0.08, filter);
        osc('sine', 440, t, 1.2, 0.06, filter);
        osc('sine', 550, t, 1.2, 0.05, filter);
    }

    /** Near-miss whoosh */
    function playNearMiss() {
        if (!ctx) return;
        resume();
        var t = now();
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.Q.value = 2;
        filter.connect(masterGain);
        noise(t, 0.12, 0.15, filter);
        osc('sine', 1200, t, 0.08, 0.06);
    }

    /** Perfect drop — sparkle */
    function playPerfect() {
        if (!ctx) return;
        resume();
        var t = now();
        osc('sine', 1200, t, 0.1, 0.15);
        osc('sine', 1600, t + 0.05, 0.1, 0.12);
        osc('sine', 2000, t + 0.1, 0.15, 0.1);
    }

    return {
        init: init,
        resume: resume,
        setMuted: setMuted,
        toggleMute: toggleMute,
        isMuted: isMuted,
        playBounce: playBounce,
        playCrash: playCrash,
        playScoreTick: playScoreTick,
        playCombo: playCombo,
        playThemeTransition: playThemeTransition,
        playNearMiss: playNearMiss,
        playPerfect: playPerfect
    };
})();
