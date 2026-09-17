/**
 * Store settings vs debug.
 * Production builds disable T / double-click / Demo. Store mute still works.
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});

  /**
   * @param {{ production?: boolean }} [buildFlags]
   * @returns {boolean}
   */
  function isProductionBuild(buildFlags) {
    const flags = buildFlags || {};
    if (flags.production === false) {
      return false;
    }
    if (typeof root.__QMS_PRODUCTION__ !== 'undefined') {
      return root.__QMS_PRODUCTION__ !== false;
    }
    return true;
  }

  /**
   * @param {{ production?: boolean }} [buildFlags]
   * @returns {boolean}
   */
  function isDebugEnabled(buildFlags) {
    return !isProductionBuild(buildFlags);
  }

  /**
   * @param {object} options
   */
  function createSettingsController(options) {
    const opts = options || {};
    const production = isProductionBuild(opts.buildFlags);
    const debugEnabled = !production;
    const doc = opts.document || (typeof root.document !== 'undefined' ? root.document : null);

    let demoTimer = null;
    let demoNumber = 1;
    let demoOn = false;
    let storeOpen = false;
    let debugOpen = false;

    function $(id) {
      return doc ? doc.getElementById(id) : null;
    }

    function setVisible(el, visible) {
      if (!el) {
        return;
      }
      el.hidden = !visible;
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    function syncButtons() {
      const muteBtn = $('qms-store-mute');
      if (muteBtn) {
        muteBtn.textContent = opts.isMuted && opts.isMuted() ? '靜音：開' : '靜音：關';
      }
      const demoBtn = $('qms-debug-demo');
      if (demoBtn) {
        demoBtn.textContent = demoOn ? 'Demo：開' : 'Demo：關';
      }
    }

    function openStore(open) {
      storeOpen = open !== false;
      setVisible($('qms-store-panel'), storeOpen);
      syncButtons();
    }

    function openDebug(open) {
      if (!debugEnabled) {
        return;
      }
      debugOpen = open !== false;
      setVisible($('qms-debug-panel'), debugOpen);
      syncButtons();
    }

    function toggleStore() {
      openStore(!storeOpen);
    }

    function toggleDebug() {
      if (!debugEnabled) {
        return;
      }
      openDebug(!debugOpen);
    }

    function stopDemo() {
      demoOn = false;
      if (demoTimer) {
        clearInterval(demoTimer);
        demoTimer = null;
      }
      syncButtons();
    }

    function startDemo() {
      if (!debugEnabled || typeof opts.onDebugCall !== 'function') {
        return;
      }
      demoOn = true;
      const tick = function () {
        const code = String(demoNumber).padStart(3, '0');
        demoNumber += 1;
        if (demoNumber > 999) {
          demoNumber = 1;
        }
        opts.onDebugCall(code);
      };
      tick();
      demoTimer = setInterval(tick, 6000);
      syncButtons();
    }

    function bindLongPress(el, callback) {
      if (!el) {
        return;
      }
      let timer = null;
      const start = function (event) {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(function () {
          timer = null;
          callback(event);
        }, 1800);
      };
      const cancel = function () {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', cancel);
      el.addEventListener('pointerleave', cancel);
      el.addEventListener('pointercancel', cancel);
    }

    function bind() {
      if (!doc) {
        return;
      }

      const storeClose = $('qms-store-close');
      if (storeClose) {
        storeClose.addEventListener('click', function () {
          openStore(false);
        });
      }
      const muteBtn = $('qms-store-mute');
      if (muteBtn && typeof opts.onMuteToggle === 'function') {
        muteBtn.addEventListener('click', function () {
          opts.onMuteToggle();
          syncButtons();
        });
      }

      bindLongPress($('qms-logo-hit'), function () {
        toggleStore();
      });

      if (opts.openStoreOnLoad) {
        openStore(true);
      }

      if (!debugEnabled) {
        setVisible($('qms-debug-panel'), false);
        return;
      }

      const debugClose = $('qms-debug-close');
      if (debugClose) {
        debugClose.addEventListener('click', function () {
          openDebug(false);
        });
      }
      const callBtn = $('qms-debug-call');
      const input = $('qms-debug-input');
      if (callBtn && input && typeof opts.onDebugCall === 'function') {
        callBtn.addEventListener('click', function () {
          const value = input.value;
          input.value = '';
          opts.onDebugCall(value);
        });
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            const value = input.value;
            input.value = '';
            opts.onDebugCall(value);
          }
        });
      }
      const clearBtn = $('qms-debug-clear');
      if (clearBtn && typeof opts.onClear === 'function') {
        clearBtn.addEventListener('click', opts.onClear);
      }
      const demoBtn = $('qms-debug-demo');
      if (demoBtn) {
        demoBtn.addEventListener('click', function () {
          if (demoOn) {
            stopDemo();
            return;
          }
          startDemo();
        });
      }

      const banner = $('qms-banner') || $('qms-queue-wall');
      if (banner) {
        banner.addEventListener('dblclick', function () {
          toggleDebug();
        });
      }

      const keyTarget = opts.keyTarget || root;
      keyTarget.addEventListener('keydown', function (event) {
        const tag = event.target && event.target.tagName ? String(event.target.tagName).toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') {
          return;
        }
        if (event.key === 't' || event.key === 'T') {
          event.preventDefault();
          toggleDebug();
        }
      });
    }

    return {
      production: production,
      debugEnabled: debugEnabled,
      bind: bind,
      openStore: openStore,
      openDebug: openDebug,
      stopDemo: stopDemo,
      syncButtons: syncButtons,
    };
  }

  QMS.isProductionBuild = isProductionBuild;
  QMS.isDebugEnabled = isDebugEnabled;
  QMS.createSettingsController = createSettingsController;
})(typeof window !== 'undefined' ? window : globalThis);
