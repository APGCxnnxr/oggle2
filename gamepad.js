// gamepad.js - minimal Gamepad manager with deadzone, events and rumble helper
(function(global){
  function createGamepadManager(options = {}) {
    const deadzone = options.deadzone ?? 0.18;
    let connected = {};
    let prevButtons = {};
    let prevAxes = {};
    let onConnect = options.onConnect || (() => {});
    let onDisconnect = options.onDisconnect || (() => {});
    let onButtonDown = options.onButtonDown || (() => {});
    let onButtonUp = options.onButtonUp || (() => {});
    let onAxis = options.onAxis || (() => {});
    function normalize(v){ return Math.abs(v) < deadzone ? 0 : v; }

    window.addEventListener("gamepadconnected", (e) => {
      const gp = e.gamepad;
      connected[gp.index] = gp;
      prevButtons[gp.index] = (gp.buttons||[]).map(b=>!!b.pressed);
      prevAxes[gp.index] = (gp.axes||[]).slice();
      try { onConnect(gp); } catch(e) { console.error(e); }
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      const gp = e.gamepad;
      delete connected[gp.index];
      delete prevButtons[gp.index];
      delete prevAxes[gp.index];
      try { onDisconnect(gp); } catch(e) { console.error(e); }
    });

    function scan() {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i=0;i<gps.length;i++){
        const g = gps[i];
        if (!g) continue;
        if (!connected[g.index]) {
          // synth connect if missed
          const ev = new Event('gamepadconnected'); ev.gamepad = g;
          window.dispatchEvent(ev);
        } else {
          connected[g.index] = g;
        }
      }
    }

    function updateOnce() {
      scan();
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i=0;i<gps.length;i++){
        const g = gps[i];
        if (!g) continue;
        const idx = g.index;
        const buttons = (g.buttons||[]).map(b=>!!b.pressed);
        const prevB = prevButtons[idx] || [];
        for (let bi=0; bi<buttons.length; bi++){
          if (buttons[bi] && !prevB[bi]) try { onButtonDown(bi, g); } catch(e) { console.error(e); }
          if (!buttons[bi] && prevB[bi]) try { onButtonUp(bi, g); } catch(e) { console.error(e); }
        }
        prevButtons[idx] = buttons;
        const axes = (g.axes||[]).map(normalize);
        const prevA = prevAxes[idx] || [];
        for (let ai=0; ai<axes.length; ai++){
          if (Math.abs((prevA[ai]||0) - axes[ai]) > 0.01) try { onAxis(ai, axes[ai], g); } catch(e) { console.error(e); }
        }
        prevAxes[idx] = axes;

        // helper to trigger rumble
        g.rumble = async function(duration=100, strong=0.5, weak=0.5){
          try {
            if (g.vibrationActuator && g.vibrationActuator.type === 'dual-rumble') {
              await g.vibrationActuator.playEffect('dual-rumble', { duration, strongMagnitude: strong, weakMagnitude: weak });
            } else if (navigator.vibrate) navigator.vibrate(duration);
          } catch(e){ /*ignore*/ }
        };
      }
    }

    let autoPoll = null;
    return {
      update() { if (autoPoll===null) updateOnce(); },
      startAuto(ms=16){ if (autoPoll) clearInterval(autoPoll); autoPoll = setInterval(updateOnce, ms); },
      stopAuto(){ if (autoPoll) { clearInterval(autoPoll); autoPoll = null; } },
      forceScan: scan,
      getConnected: () => Object.values(connected),
      set onConnect(cb){ onConnect = cb; },
      set onDisconnect(cb){ onDisconnect = cb; },
      set onButtonDown(cb){ onButtonDown = cb; },
      set onButtonUp(cb){ onButtonUp = cb; },
      set onAxis(cb){ onAxis = cb; }
    };
  }

  global.createGamepadManager = createGamepadManager;
})(window);
