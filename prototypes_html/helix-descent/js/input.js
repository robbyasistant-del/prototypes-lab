/**
 * Helix Descent — Unified Input Handler
 * Touch drag, mouse drag, keyboard arrows → tower angular velocity.
 */
var HelixDescent = HelixDescent || {};

HelixDescent.Input = (function () {
    'use strict';

    var TOUCH_SENSITIVITY = 0.009;   // radians per pixel of drag
    var MOUSE_SENSITIVITY = 0.007;
    var KEY_ROTATION_FORCE = 8.0;    // radians/s² when key held

    var angularForce = 0;            // current frame rotational input
    var dragging = false;
    var lastX = 0;
    var dragDeltaX = 0;

    var keysDown = {};
    var tapCallback = null;          // called on tap/click (for menu/restart)
    var canvas = null;

    function init(canvasEl, onTap) {
        canvas = canvasEl;
        tapCallback = onTap;

        // Touch
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

        // Mouse
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // Keyboard
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
    }

    function destroy() {
        if (!canvas) return;
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
        canvas.removeEventListener('touchcancel', onTouchEnd);
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    }

    /* ---- Touch ---- */
    var touchStartX = 0;
    var touchMoved = false;

    function onTouchStart(e) {
        e.preventDefault();
        HelixDescent.Audio.resume();
        var t = e.touches[0];
        dragging = true;
        lastX = t.clientX;
        touchStartX = t.clientX;
        touchMoved = false;
        dragDeltaX = 0;
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (!dragging) return;
        var t = e.touches[0];
        dragDeltaX = t.clientX - lastX;
        lastX = t.clientX;
        if (Math.abs(t.clientX - touchStartX) > 8) touchMoved = true;
    }

    function onTouchEnd(e) {
        e.preventDefault();
        dragging = false;
        dragDeltaX = 0;
        if (!touchMoved && tapCallback) tapCallback();
    }

    /* ---- Mouse ---- */
    var mouseStartX = 0;
    var mouseMoved = false;

    function onMouseDown(e) {
        HelixDescent.Audio.resume();
        dragging = true;
        lastX = e.clientX;
        mouseStartX = e.clientX;
        mouseMoved = false;
        dragDeltaX = 0;
    }

    function onMouseMove(e) {
        if (!dragging) return;
        dragDeltaX = e.clientX - lastX;
        lastX = e.clientX;
        if (Math.abs(e.clientX - mouseStartX) > 5) mouseMoved = true;
    }

    function onMouseUp() {
        dragging = false;
        dragDeltaX = 0;
        if (!mouseMoved && tapCallback) tapCallback();
    }

    /* ---- Keyboard ---- */

    function onKeyDown(e) {
        keysDown[e.code] = true;
        if (e.code === 'Space' || e.code === 'Enter') {
            if (tapCallback) tapCallback();
        }
    }

    function onKeyUp(e) {
        keysDown[e.code] = false;
    }

    /* ---- Per-frame query ---- */

    /**
     * Call once per physics step.
     * Returns angular force to apply to the tower (radians/s²).
     */
    function getAngularForce() {
        var force = 0;

        // Drag (touch or mouse) → direct velocity injection
        if (dragging && dragDeltaX !== 0) {
            var sens = ('ontouchstart' in window) ? TOUCH_SENSITIVITY : MOUSE_SENSITIVITY;
            force = dragDeltaX * sens * 60; // scale to per-second
            dragDeltaX = 0;
        }

        // Keyboard
        if (keysDown['ArrowLeft'] || keysDown['KeyA']) force -= KEY_ROTATION_FORCE;
        if (keysDown['ArrowRight'] || keysDown['KeyD']) force += KEY_ROTATION_FORCE;

        return force;
    }

    /** True if any drag is active (used to apply stronger damping when dragging). */
    function isDragging() { return dragging; }

    return {
        init: init,
        destroy: destroy,
        getAngularForce: getAngularForce,
        isDragging: isDragging
    };
})();
