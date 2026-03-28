/**
 * Helix Descent — Web Audio API Sound Synthesis
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Audio = (function () {
    'use strict';

    var ctx = null, master = null, muted = false, vol = 0.45;

    function init() {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.gain.value = vol;
            master.connect(ctx.destination);
        } catch (e) { /* no audio */ }
    }

    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : vol; return muted; }

    function t() { return ctx ? ctx.currentTime : 0; }

    function osc(type, freq, start, dur, gain, dest) {
        if (!ctx) return;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(gain, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        o.connect(g); g.connect(dest || master);
        o.start(start); o.stop(start + dur);
    }

    function noise(start, dur, gain, dest) {
        if (!ctx) return;
        var len = Math.ceil(ctx.sampleRate * dur);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        var s = ctx.createBufferSource(); s.buffer = buf;
        var g = ctx.createGain();
        g.gain.setValueAtTime(gain, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        s.connect(g); g.connect(dest || master);
        s.start(start); s.stop(start + dur);
    }

    function playBounce(speedMul) {
        if (!ctx) return; resume();
        var n = t(), f = 550 + Math.random() * 120;
        f *= (0.85 + (speedMul || 1) * 0.15);
        osc('sine', f, n, 0.09, 0.22);
        osc('sine', f * 1.5, n, 0.05, 0.08);
        noise(n, 0.03, 0.05);
    }

    function playCrash() {
        if (!ctx) return; resume();
        var n = t();
        osc('sawtooth', 55, n, 0.45, 0.28);
        osc('sine', 38, n, 0.5, 0.18);
        noise(n, 0.18, 0.32);
        osc('square', 190, n, 0.07, 0.18);
        osc('square', 140, n + 0.03, 0.09, 0.13);
    }

    function playScoreTick(combo) {
        if (!ctx) return; resume();
        var n = t(), f = 750 + Math.min(combo || 0, 12) * 55;
        osc('sine', f, n, 0.07, 0.10);
    }

    function playCombo(level) {
        if (!ctx) return; resume();
        var n = t(), base = 480 + Math.min(level, 10) * 70;
        osc('sine', base, n, 0.1, 0.16);
        osc('sine', base * 1.25, n + 0.06, 0.1, 0.13);
        osc('sine', base * 1.5, n + 0.12, 0.14, 0.10);
    }

    function playThemeTransition() {
        if (!ctx) return; resume();
        var n = t();
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(200, n);
        filt.frequency.exponentialRampToValueAtTime(3500, n + 1.0);
        filt.connect(master);
        osc('sine', 330, n, 1.1, 0.07, filt);
        osc('sine', 440, n, 1.1, 0.05, filt);
        osc('sine', 550, n, 1.1, 0.04, filt);
    }

    function playNearMiss() {
        if (!ctx) return; resume();
        var n = t();
        var filt = ctx.createBiquadFilter();
        filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 2;
        filt.connect(master);
        noise(n, 0.10, 0.12, filt);
        osc('sine', 1100, n, 0.07, 0.05);
    }

    return {
        init: init, resume: resume, toggleMute: toggleMute, isMuted: function(){ return muted; },
        playBounce: playBounce, playCrash: playCrash, playScoreTick: playScoreTick,
        playCombo: playCombo, playThemeTransition: playThemeTransition, playNearMiss: playNearMiss
    };
})();
