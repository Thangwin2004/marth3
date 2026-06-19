/**
 * Wink Bridge v8.0 — Audio Control + Interaction SDK (postMessage)
 *
 * MUST be the FIRST <script> in <head>, before any game engine code.
 *
 * Works with ALL HTML5 game engines:
 *   Three.js, Unity WebGL, Phaser, Construct, PlayCanvas,
 *   Godot, Cocos, GDevelop, PixiJS, vanilla Canvas/DOM, etc.
 *
 * Features:
 *   ✓ Mute/unmute via postMessage from parent
 *   ✓ Intercepts Audio, AudioContext, HTMLMediaElement.play
 *   ✓ Tracks TRUSTED user interactions only (isTrusted filter)
 *   ✓ Sends throttled "user_interaction" postMessage to parent
 *   ✓ Canvas auto-detection via MutationObserver
 *   ✓ Gamepad polling
 *   ✓ Cached native APIs — immune to game engine overrides
 *   ✓ Heartbeat via setInterval (no rAF — avoids chain accumulation)
 *
 * Usage in parent (React, Vue, vanilla, etc.):
 *   iframeRef.contentWindow.postMessage({ type: "mute" }, "*");
 *   iframeRef.contentWindow.postMessage({ type: "unmute" }, "*");
 *
 *   window.addEventListener("message", (e) => {
 *     if (e.data?.type === "user_interaction") { ... }
 *   });
 */
(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════
  // 0. CACHE NATIVE APIs
  //    Save references BEFORE any game engine can override them.
  //    This is the #1 reason scripts fail in specific games —
  //    the engine replaces addEventListener, postMessage, etc.
  // ═══════════════════════════════════════════════════════════════

  var _addEventListener = EventTarget.prototype.addEventListener;
  var _postMessage =
    window.parent !== window
      ? window.parent.postMessage.bind(window.parent)
      : null;
  var _setTimeout = window.setTimeout.bind(window);
  var _clearTimeout = window.clearTimeout.bind(window);
  var _setInterval = window.setInterval.bind(window);
  var _DateNow = Date.now;

  // ═══════════════════════════════════════════════════════════════
  // 1. AUDIO CONTROL
  // ═══════════════════════════════════════════════════════════════

  window.__GLOBAL_MUTE__ = true;
  window.__ALL_AUDIOS__ = [];
  window.__ALL_AUDIO_CONTEXTS__ = [];

  // 1a. Intercept new Audio(...)
  var OrigAudio = window.Audio;
  if (OrigAudio) {
    window.Audio = function () {
      var a = new OrigAudio(arguments.length > 0 ? arguments[0] : undefined);
      a.muted = window.__GLOBAL_MUTE__;
      window.__ALL_AUDIOS__.push(a);
      return a;
    };
    window.Audio.prototype = OrigAudio.prototype;
    window.Audio.prototype.constructor = window.Audio;
  }

  // 1b. Intercept AudioContext / webkitAudioContext
  var OrigCtx = window.AudioContext || window.webkitAudioContext;
  if (OrigCtx) {
    var PatchedCtx = function () {
      var ctx = new OrigCtx();
      window.__ALL_AUDIO_CONTEXTS__.push(ctx);
      if (window.__GLOBAL_MUTE__) {
        try {
          ctx.suspend();
        } catch (_) {}
      }
      return ctx;
    };
    PatchedCtx.prototype = OrigCtx.prototype;
    window.AudioContext = PatchedCtx;
    if (window.webkitAudioContext) window.webkitAudioContext = PatchedCtx;
  }

  // 1c. Intercept HTMLMediaElement.prototype.play
  var origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window.__GLOBAL_MUTE__) this.muted = true;
    if (window.__ALL_AUDIOS__.indexOf(this) === -1) {
      window.__ALL_AUDIOS__.push(this);
    }
    return origPlay.apply(this, arguments);
  };

  // 1d. Mute / Unmute helpers
  function muteAll() {
    window.__GLOBAL_MUTE__ = true;
    var i;
    for (i = 0; i < window.__ALL_AUDIOS__.length; i++) {
      try {
        window.__ALL_AUDIOS__[i].muted = true;
      } catch (_) {}
      try {
        window.__ALL_AUDIOS__[i].pause();
      } catch (_) {}
    }
    for (i = 0; i < window.__ALL_AUDIO_CONTEXTS__.length; i++) {
      try {
        window.__ALL_AUDIO_CONTEXTS__[i].suspend();
      } catch (_) {}
    }
    // Sweep DOM for stray <audio>/<video>
    try {
      var els = document.querySelectorAll("audio, video");
      for (var j = 0; j < els.length; j++) {
        els[j].muted = true;
        try {
          els[j].pause();
        } catch (_) {}
        if (window.__ALL_AUDIOS__.indexOf(els[j]) === -1) {
          window.__ALL_AUDIOS__.push(els[j]);
        }
      }
    } catch (_) {}
  }

  function unmuteAll() {
    window.__GLOBAL_MUTE__ = false;
    var i;
    for (i = 0; i < window.__ALL_AUDIOS__.length; i++) {
      try {
        window.__ALL_AUDIOS__[i].muted = false;
      } catch (_) {}
    }
    for (i = 0; i < window.__ALL_AUDIO_CONTEXTS__.length; i++) {
      try {
        window.__ALL_AUDIO_CONTEXTS__[i].resume();
      } catch (_) {}
    }
  }

  // 1e. Listen for mute/unmute from parent — using CACHED addEventListener
  //     Support BOTH { type: "mute" } and plain string "mute"
  //     NO type guard — some SDKs (Poki, etc.) post non-object messages
  _addEventListener.call(window, "message", function (evt) {
    var d = evt.data;
    if (!d) return;
    var t = typeof d === "string" ? d : d && d.type;
    if (t === "mute") muteAll();
    else if (t === "unmute") unmuteAll();
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. INTERACTION TRACKER
  // ═══════════════════════════════════════════════════════════════

  // 2a. Slug from URL
  var pathParts = window.location.pathname.split("/").filter(function (p) {
    return p.length > 0;
  });
  var SLUG = "unknown";
  if (pathParts.length > 0 && pathParts[0].indexOf(".") === -1) {
    SLUG = pathParts[0];
  } else if (pathParts.length > 1) {
    SLUG = pathParts[pathParts.length - 2];
  }

  var lastMsgSent = 0;
  var THROTTLE = 200;

  // Track whether a pointer/touch/mouse is currently HELD DOWN.
  // This is critical: touchstart/mousedown only fires ONCE, so without
  // this flag the heartbeat would stop after IDLE_GRACE even though
  // the user is still pressing.
  var pointerDown = false;
  var IDLE_GRACE = 2000; // ms of no events before heartbeat stops (only if NOT held)
  var lastEventTime = 0;

  // 2b. Send interaction message using CACHED postMessage
  function notify() {
    var now = _DateNow();
    if (now - lastMsgSent < THROTTLE) return;
    if (!_postMessage) return;
    try {
      _postMessage(
        {
          type: "user_interaction",
          game: SLUG,
          timestamp: now,
        },
        "*",
      );
      lastMsgSent = now;
    } catch (_) {}
  }

  // 2c. Mark user as active — called from trusted event handlers
  function startInteraction() {
    lastEventTime = _DateNow();
    notify();
  }

  // 2d. Event handler wrapper — REJECTS synthetic/programmatic events.
  function onTrustedEvent(e) {
    if (e && e.isTrusted === false) return;
    startInteraction();
  }

  // 2e. Track pointer/touch held state
  function onPointerDown(e) {
    if (e && e.isTrusted === false) return;
    pointerDown = true;
    console.log("[WinkBridge] Pointer DOWN - will send continuously");
    startInteraction();
  }

  function onPointerUp(e) {
    if (e && e.isTrusted === false) return;
    pointerDown = false;
    console.log("[WinkBridge] Pointer UP - grace period started");
    // One last notify so parent knows interaction just ended
    lastEventTime = _DateNow();
    notify();
  }

  // 2f. Heartbeat — sends while user is interacting.
  //     Active if: pointer is held down OR last event was < IDLE_GRACE ago.
  _setInterval(function () {
    if (pointerDown) {
      // User is holding — ALWAYS send
      console.log("[WinkBridge] Heartbeat: pointer held, sending...");
      notify();
    } else if (_DateNow() - lastEventTime < IDLE_GRACE) {
      // User released recently — keep sending for a bit
      console.log("[WinkBridge] Heartbeat: grace period, sending...");
      notify();
    }
  }, THROTTLE);

  // ═══════════════════════════════════════════════════════════════
  // 2g. EVENT LIST
  //     Comprehensive — covers ALL game engines and input methods
  // ═══════════════════════════════════════════════════════════════

  var START_EVENTS = [
    // Mouse (mousemove fires continuously while moving)
    "mousemove",
    "click",
    "dblclick",
    "contextmenu",
    // Touch (touchmove fires continuously while dragging)
    "touchmove",
    // Pointer (pointermove fires continuously)
    "pointermove",
    // Keyboard
    "keydown",
    "keyup",
    "keypress",
    // Wheel & scroll
    "wheel",
    "scroll",
    // Drag
    "dragstart",
    "drag",
    "drop",
    // Focus
    "focus",
  ];

  // Events that mark pointer DOWN (held)
  var DOWN_EVENTS = ["mousedown", "touchstart", "pointerdown"];
  // Events that mark pointer UP (released)
  var UP_EVENTS = ["mouseup", "touchend", "touchcancel", "pointerup"];
  var OPTS = { capture: true, passive: true };

  // 2h. Register on window
  var i;
  for (i = 0; i < START_EVENTS.length; i++) {
    _addEventListener.call(window, START_EVENTS[i], onTrustedEvent, OPTS);
  }
  for (i = 0; i < DOWN_EVENTS.length; i++) {
    _addEventListener.call(window, DOWN_EVENTS[i], onPointerDown, OPTS);
  }
  for (i = 0; i < UP_EVENTS.length; i++) {
    _addEventListener.call(window, UP_EVENTS[i], onPointerUp, OPTS);
  }

  // 2i. Register on document (deferred if not ready)
  function attachDocListeners() {
    for (var k = 0; k < START_EVENTS.length; k++) {
      _addEventListener.call(document, START_EVENTS[k], onTrustedEvent, OPTS);
    }
    for (var k2 = 0; k2 < DOWN_EVENTS.length; k2++) {
      _addEventListener.call(document, DOWN_EVENTS[k2], onPointerDown, OPTS);
    }
    for (var k3 = 0; k3 < UP_EVENTS.length; k3++) {
      _addEventListener.call(document, UP_EVENTS[k3], onPointerUp, OPTS);
    }
    _addEventListener.call(document, "pointerlockchange", onTrustedEvent, OPTS);
    _addEventListener.call(document, "pointerlockerror", onTrustedEvent, OPTS);
    _addEventListener.call(document, "visibilitychange", function (e) {
      if (!document.hidden && e.isTrusted !== false) startInteraction();
    });
  }

  if (document.readyState !== "loading") {
    attachDocListeners();
  } else {
    _addEventListener.call(document, "DOMContentLoaded", attachDocListeners);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2j. CANVAS AUTO-DETECTION
  // ═══════════════════════════════════════════════════════════════

  function attachToCanvas(canvas) {
    if (canvas._winkTracked) return;
    canvas._winkTracked = true;
    for (var j = 0; j < START_EVENTS.length; j++) {
      _addEventListener.call(canvas, START_EVENTS[j], onTrustedEvent, OPTS);
    }
    for (var j2 = 0; j2 < DOWN_EVENTS.length; j2++) {
      _addEventListener.call(canvas, DOWN_EVENTS[j2], onPointerDown, OPTS);
    }
    for (var j3 = 0; j3 < UP_EVENTS.length; j3++) {
      _addEventListener.call(canvas, UP_EVENTS[j3], onPointerUp, OPTS);
    }
  }

  function scanCanvases() {
    try {
      var c = document.querySelectorAll("canvas");
      for (var x = 0; x < c.length; x++) attachToCanvas(c[x]);
    } catch (_) {}
  }

  if (document.readyState !== "loading") {
    scanCanvases();
  } else {
    _addEventListener.call(document, "DOMContentLoaded", scanCanvases);
  }

  if (typeof MutationObserver !== "undefined") {
    var startObserver = function () {
      var target = document.documentElement || document.body;
      if (!target) return;
      new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
          var added = mutations[m].addedNodes;
          for (var n = 0; n < added.length; n++) {
            var node = added[n];
            if (node.nodeName === "CANVAS") attachToCanvas(node);
            if (node.querySelectorAll) {
              var inner = node.querySelectorAll("canvas");
              for (var ic = 0; ic < inner.length; ic++)
                attachToCanvas(inner[ic]);
            }
          }
        }
      }).observe(target, { childList: true, subtree: true });
    };

    if (document.documentElement) {
      startObserver();
    } else {
      _addEventListener.call(document, "DOMContentLoaded", startObserver);
    }
  }

  // 2k. GAMEPAD POLLING
  if (typeof navigator.getGamepads === "function") {
    _setInterval(function () {
      try {
        var pads = navigator.getGamepads();
        for (var g = 0; g < pads.length; g++) {
          if (!pads[g]) continue;
          for (var b = 0; b < pads[g].buttons.length; b++) {
            if (pads[g].buttons[b].pressed) {
              startInteraction();
              return;
            }
          }
          for (var a = 0; a < pads[g].axes.length; a++) {
            if (Math.abs(pads[g].axes[a]) > 0.5) {
              startInteraction();
              return;
            }
          }
        }
      } catch (_) {}
    }, 500);
  }

  console.log("[WinkBridge v8.0] Ready — slug: " + SLUG);
})();
