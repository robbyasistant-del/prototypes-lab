/**
 * Helix Descent — Unified Input Handler
 * Touch drag, mouse drag, keyboard arrows → tower angular velocity.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Input = (function () {
    'use strict';

    var TOUCH_SENS = 0.012;
    var MOUSE_SENS = 0.009;
    var KEY_FORCE  = 9.0;

    var force = 0, dragging = false, lastX = 0, deltaX = 0;
    var keys = {};
    var tapCb = null, canvas = null;

    /* touch */
    var touchStartX = 0, touchMoved = false;

    function onTS(e) {
        e.preventDefault(); HelixDescent.Audio.resume();
        var tc = e.touches[0];
        dragging = true; lastX = tc.clientX; touchStartX = tc.clientX;
        touchMoved = false; deltaX = 0;
    }
    function onTM(e) {
        e.preventDefault(); if (!dragging) return;
        var tc = e.touches[0];
        deltaX = tc.clientX - lastX; lastX = tc.clientX;
        if (Math.abs(tc.clientX - touchStartX) > 8) touchMoved = true;
    }
    function onTE(e) {
        e.preventDefault(); dragging = false; deltaX = 0;
        if (!touchMoved && tapCb) tapCb();
    }

    /* mouse */
    var mouseStartX = 0, mouseMoved = false;

    function onMD(e) {
        HelixDescent.Audio.resume();
        dragging = true; lastX = e.clientX; mouseStartX = e.clientX;
        mouseMoved = false; deltaX = 0;
    }
    function onMM(e) {
        if (!dragging) return;
        deltaX = e.clientX - lastX; lastX = e.clientX;
        if (Math.abs(e.clientX - mouseStartX) > 5) mouseMoved = true;
    }
    function onMU() {
        dragging = false; deltaX = 0;
        if (!mouseMoved && tapCb) tapCb();
    }

    /* keyboard */
    function onKD(e) {
        keys[e.code] = true;
        if (e.code === 'Space' || e.code === 'Enter') { if (tapCb) tapCb(); }
    }
    function onKU(e) { keys[e.code] = false; }

    function init(el, onTap) {
        canvas = el; tapCb = onTap;
        canvas.addEventListener('touchstart', onTS, { passive: false });
        canvas.addEventListener('touchmove', onTM, { passive: false });
        canvas.addEventListener('touchend', onTE, { passive: false });
        canvas.addEventListener('touchcancel', onTE, { passive: false });
        canvas.addEventListener('mousedown', onMD);
        window.addEventListener('mousemove', onMM);
        window.addEventListener('mouseup', onMU);
        window.addEventListener('keydown', onKD);
        window.addEventListener('keyup', onKU);
    }

    function getAngularForce() {
        var f = 0;
        if (dragging && deltaX !== 0) {
            var s = ('ontouchstart' in window) ? TOUCH_SENS : MOUSE_SENS;
            f = deltaX * s * 60;
            deltaX = 0;
        }
        if (keys['ArrowLeft'] || keys['KeyA']) f -= KEY_FORCE;
        if (keys['ArrowRight'] || keys['KeyD']) f += KEY_FORCE;
        return f;
    }

    function isDragging() { return dragging; }

    return { init: init, getAngularForce: getAngularForce, isDragging: isDragging };
})();
