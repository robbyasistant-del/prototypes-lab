/**
 * Helix Descent — Theme Definitions & Color Utilities
 * Defines visual themes and provides color interpolation for smooth transitions.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Themes = (function () {
    'use strict';

    var themes = [
        {
            name: 'Classic',
            bg1: '#dceefb',
            bg2: '#b8ddf5',
            platform: '#00bcd4',
            platformAlt: '#0097a7',
            platformSide: '#00838f',
            danger: '#f44336',
            dangerAlt: '#d32f2f',
            dangerSide: '#b71c1c',
            ball: '#ffffff',
            ballOutline: '#b0bec5',
            ballShadow: 'rgba(0,0,0,0.18)',
            pillar1: '#cfd8dc',
            pillar2: '#90a4ae',
            text: '#263238',
            accent: '#ff9800',
            scorePopup: '#00bcd4',
            particles: ['#00bcd4', '#4dd0e1', '#80deea', '#ffffff'],
            dangerParticles: ['#f44336', '#ff5252', '#ff8a80', '#ffcdd2'],
            comboColor: '#ff9800',
            glow: false
        },
        {
            name: 'Neon Night',
            bg1: '#0a0a2e',
            bg2: '#12123a',
            platform: '#00e5ff',
            platformAlt: '#00b8d4',
            platformSide: '#006978',
            danger: '#ff1744',
            dangerAlt: '#d50000',
            dangerSide: '#9a0007',
            ball: '#ffffff',
            ballOutline: '#b2ebf2',
            ballShadow: 'rgba(0,229,255,0.12)',
            pillar1: '#1a237e',
            pillar2: '#0d1442',
            text: '#e0f7fa',
            accent: '#ff4081',
            scorePopup: '#18ffff',
            particles: ['#00e5ff', '#18ffff', '#84ffff', '#e0f7fa'],
            dangerParticles: ['#ff1744', '#ff616f', '#ff8a80', '#ff80ab'],
            comboColor: '#ff4081',
            glow: true
        },
        {
            name: 'Sunset',
            bg1: '#ff7043',
            bg2: '#ff8a65',
            platform: '#5d4037',
            platformAlt: '#4e342e',
            platformSide: '#3e2723',
            danger: '#b71c1c',
            dangerAlt: '#880e4f',
            dangerSide: '#560027',
            ball: '#fff8e1',
            ballOutline: '#ffe082',
            ballShadow: 'rgba(62,39,35,0.22)',
            pillar1: '#6d4c41',
            pillar2: '#4e342e',
            text: '#fff8e1',
            accent: '#ffd54f',
            scorePopup: '#ffd54f',
            particles: ['#ffd54f', '#ffe082', '#ffecb3', '#fff8e1'],
            dangerParticles: ['#b71c1c', '#e53935', '#ff5252', '#ff8a80'],
            comboColor: '#ffd54f',
            glow: false
        }
    ];

    /* ---- colour helpers ---- */

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        var n = parseInt(hex, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function lerpColor(hex1, hex2, t) {
        var a = hexToRgb(hex1), b = hexToRgb(hex2);
        var r = Math.round(a[0] + (b[0] - a[0]) * t);
        var g = Math.round(a[1] + (b[1] - a[1]) * t);
        var bl = Math.round(a[2] + (b[2] - a[2]) * t);
        return rgbToHex(r, g, bl);
    }

    function lerpTheme(themeA, themeB, t) {
        var result = {};
        for (var key in themeA) {
            if (!themeA.hasOwnProperty(key)) continue;
            var va = themeA[key], vb = themeB[key];
            if (typeof va === 'string' && va.charAt(0) === '#') {
                result[key] = lerpColor(va, vb, t);
            } else if (Array.isArray(va) && typeof va[0] === 'string' && va[0].charAt(0) === '#') {
                result[key] = va.map(function (c, i) { return lerpColor(c, vb[i] || c, t); });
            } else if (typeof va === 'boolean') {
                result[key] = t < 0.5 ? va : vb;
            } else {
                result[key] = va;
            }
        }
        return result;
    }

    /* ---- public API ---- */

    var FLOORS_PER_THEME = 50;
    var TRANSITION_FLOORS = 5; // smooth transition over 5 floors

    return {
        list: themes,
        FLOORS_PER_THEME: FLOORS_PER_THEME,

        /** Get the blended theme for the current floor depth. */
        getTheme: function (floor) {
            var idx = Math.floor(floor / FLOORS_PER_THEME) % themes.length;
            var next = (idx + 1) % themes.length;
            var posInTheme = floor % FLOORS_PER_THEME;
            var transitionStart = FLOORS_PER_THEME - TRANSITION_FLOORS;

            if (posInTheme >= transitionStart) {
                var t = (posInTheme - transitionStart) / TRANSITION_FLOORS;
                return lerpTheme(themes[idx], themes[next], t);
            }
            return themes[idx];
        },

        hexToRgb: hexToRgb,
        lerpColor: lerpColor
    };
})();
