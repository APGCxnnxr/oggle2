// gamepad-init.js - Initialize gamepad manager, UI status, mapping, and rumble
(function(){
  function sendKey(code, down){
    try{ if (typeof keys !== 'undefined' && keys !== null) { keys[code] = down; return; } }catch(e){}
    const ev = new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, bubbles: true });
    window.dispatchEvent(ev);
  }

  function createStatus(){
    let status = document.getElementById('gp-status');
    if (!status){
      status = document.createElement('div');
      status.id = 'gp-status';
      status.style.cssText = 'position:fixed;right:8px;top:8px;padding:6px 10px;background:#222;color:#fff;border-radius:6px;font-family:monospace;z-index:9999';
      status.textContent = 'No controller';
      document.body.appendChild(status);
    }
    return status;
  }

  function init() {
    if (typeof createGamepadManager !== 'function') {
      console.warn('createGamepadManager not available');
      return;
    }
    const status = createStatus();
    const gpMgr = createGamepadManager();

    gpMgr.onConnect = (g) => {
      try { status.textContent = 'Connected: ' + (g.id || g.index); status.style.background = '#063'; } catch(e){}
      try { if (g.rumble) g.rumble(120, 0.7, 0.7); } catch(e){}
    };
    gpMgr.onDisconnect = (g) => { status.textContent = 'No controller'; status.style.background = '#222'; };

    gpMgr.onButtonDown = (b, g) => {
      // Standard mapping: 0=A,1=B,2=X,3=Y,4=LB,5=RB,9=Start,12-15 D-pad
      if (b === 0) sendKey('Space', true); // A -> jump
      else if (b === 1) sendKey('KeyF', true); // B -> blade/shoot
      else if (b === 4) sendKey('KeyJ', true); // LB -> left grapple
      else if (b === 5) sendKey('KeyK', true); // RB -> right grapple
      else if (b === 9) sendKey('KeyB', true); // Start -> shop/pause
      else if (b === 12) sendKey('KeyW', true);
      else if (b === 13) sendKey('KeyS', true);
      else if (b === 14) sendKey('KeyA', true);
      else if (b === 15) sendKey('KeyD', true);
    };
    gpMgr.onButtonUp = (b, g) => {
      if (b === 0) sendKey('Space', false);
      else if (b === 1) sendKey('KeyF', false);
      else if (b === 4) sendKey('KeyJ', false);
      else if (b === 5) sendKey('KeyK', false);
      else if (b === 9) sendKey('KeyB', false);
      else if (b === 12) sendKey('KeyW', false);
      else if (b === 13) sendKey('KeyS', false);
      else if (b === 14) sendKey('KeyA', false);
      else if (b === 15) sendKey('KeyD', false);
    };

    gpMgr.onAxis = (axis, value, g) => {
      // axis 0 = left stick X
      if (axis === 0) {
        if (value < -0.3) { sendKey('KeyA', true); sendKey('KeyD', false); }
        else if (value > 0.3) { sendKey('KeyD', true); sendKey('KeyA', false); }
        else { sendKey('KeyA', false); sendKey('KeyD', false); }
      }
    };

    // Start polling in background so we don't need to alter your main game loop
    gpMgr.startAuto(16);

    // Expose manager for debugging
    window._gpMgr = gpMgr;
  }

  // Wait until DOM loaded to ensure status can be appended
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
