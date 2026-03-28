/**
 * Helix Descent — Visual Themes & Color Utilities
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Themes = (function () {
    'use strict';

    var themes = [
        {
            name: 'Classic',
            bg1: '#E3F2FD', bg2: '#FAFAFA',
            platform: '#00BCD4', platformSide: '#00838F',
            platformAlt: '#0097A7', platformAltSide: '#006064',
            danger: '#EF5350', dangerSide: '#C62828',
            dangerAlt: '#E53935', dangerAltSide: '#B71C1C',
            ball: '#FFFFFF', ballOutline: '#B0BEC5', ballHighlight: 'rgba(255,255,255,0.7)',
            ballShadow: 'rgba(0,0,0,0.15)',
            pillar1: '#B0BEC5', pillar2: '#78909C',
            gapColor: 'rgba(0,0,0,0.06)',
            particles: ['#00BCD4','#4DD0E1','#80DEEA','#FFFFFF'],
            dangerParticles: ['#EF5350','#FF5252','#FF8A80','#FFCDD2'],
            scoreColor: '#00BCD4', comboColor: '#FF9800',
            glow: false
        },
        {
            name: 'Neon Night',
            bg1: '#0D0D2B', bg2: '#1A1A3E',
            platform: '#00E5FF', platformSide: '#006978',
            platformAlt: '#00B8D4', platformAltSide: '#005662',
            danger: '#FF1744', dangerSide: '#9A0007',
            dangerAlt: '#D50000', dangerAltSide: '#7F0000',
            ball: '#FFFFFF', ballOutline: '#B2EBF2', ballHighlight: 'rgba(0,229,255,0.3)',
            ballShadow: 'rgba(0,229,255,0.10)',
            pillar1: '#1A237E', pillar2: '#0D1442',
            gapColor: 'rgba(0,229,255,0.04)',
            particles: ['#00E5FF','#18FFFF','#84FFFF','#E0F7FA'],
            dangerParticles: ['#FF1744','#FF616F','#FF8A80','#FF80AB'],
            scoreColor: '#18FFFF', comboColor: '#FF4081',
            glow: true
        },
        {
            name: 'Sunset',
            bg1: '#FF8A65', bg2: '#FFE0B2',
            platform: '#5D4037', platformSide: '#3E2723',
            platformAlt: '#4E342E', platformAltSide: '#321911',
            danger: '#B71C1C', dangerSide: '#560027',
            dangerAlt: '#880E4F', dangerAltSide: '#3E0018',
            ball: '#FFF8E1', ballOutline: '#FFE082', ballHighlight: 'rgba(255,248,225,0.6)',
            ballShadow: 'rgba(62,39,35,0.18)',
            pillar1: '#6D4C41', pillar2: '#4E342E',
            gapColor: 'rgba(62,39,35,0.06)',
            particles: ['#FFD54F','#FFE082','#FFECB3','#FFF8E1'],
            dangerParticles: ['#B71C1C','#E53935','#FF5252','#FF8A80'],
            scoreColor: '#FFD54F', comboColor: '#FFD54F',
            glow: false
        }
    ];

    function hexToRgb(hex) {
        hex = hex.replace('#','');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        var n = parseInt(hex, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }

    function lerpColor(a, b, t) {
        var ca = hexToRgb(a), cb = hexToRgb(b);
        return rgbToHex(
            Math.round(ca[0] + (cb[0] - ca[0]) * t),
            Math.round(ca[1] + (cb[1] - ca[1]) * t),
            Math.round(ca[2] + (cb[2] - ca[2]) * t)
        );
    }

    function lerpTheme(a, b, t) {
        var out = {};
        for (var k in a) {
            if (!a.hasOwnProperty(k)) continue;
            var va = a[k], vb = b[k];
            if (typeof va === 'string' && va.charAt(0) === '#') {
                out[k] = lerpColor(va, vb, t);
            } else if (Array.isArray(va) && va.length && typeof va[0] === 'string' && va[0].charAt(0) === '#') {
                out[k] = [];
                for (var i = 0; i < va.length; i++) out[k][i] = lerpColor(va[i], (vb[i] || va[i]), t);
            } else if (typeof va === 'boolean') {
                out[k] = t < 0.5 ? va : vb;
            } else {
                out[k] = va;
            }
        }
        return out;
    }

    var FLOORS_PER_THEME = 50;
    var TRANSITION_FLOORS = 5;

    return {
        list: themes,
        FLOORS_PER_THEME: FLOORS_PER_THEME,
        getTheme: function (floor) {
            var idx = Math.floor(floor / FLOORS_PER_THEME) % themes.length;
            var next = (idx + 1) % themes.length;
            var pos = floor % FLOORS_PER_THEME;
            var start = FLOORS_PER_THEME - TRANSITION_FLOORS;
            if (pos >= start) {
                return lerpTheme(themes[idx], themes[next], (pos - start) / TRANSITION_FLOORS);
            }
            return themes[idx];
        },
        lerpColor: lerpColor,
        hexToRgb: hexToRgb
    };
})();
