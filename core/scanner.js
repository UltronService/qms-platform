/**
 * USB HID barcode scanner: buffer keystrokes, normalize, then call state.
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});

  /**
   * @param {unknown} raw
   * @returns {string}
   */
  function normalizeBarcode(raw) {
    if (raw == null) {
      return '';
    }
    let code = String(raw).replace(/[\r\n\t]/g, '').trim().toUpperCase();
    if (!code) {
      return '';
    }
    if (!/^\d+$/.test(code)) {
      return code;
    }
    const parsed = parseInt(code, 10);
    if (!Number.isFinite(parsed)) {
      return '';
    }
    const num = parsed > 999 ? parsed % 1000 : parsed;
    return String(num).padStart(3, '0');
  }

  /**
   * @param {object} [options]
   */
  function createScanner(options) {
    const opts = options || {};
    const charTimeout = opts.charTimeout > 0 ? opts.charTimeout : 100;
    const minLength = opts.minLength > 0 ? opts.minLength : 1;
    const onScan = typeof opts.onScan === 'function' ? opts.onScan : function () {};
    const target = opts.target || (typeof root.addEventListener === 'function' ? root : null);

    let buffer = '';
    let lastTime = 0;
    let listening = false;

    function trigger(raw) {
      const code = normalizeBarcode(raw);
      if (!code || code.length < minLength) {
        return;
      }
      onScan(code);
    }

    function handleKeyDown(event) {
      const targetEl = event.target;
      const tag = targetEl && targetEl.tagName ? String(targetEl.tagName).toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      const now = Date.now();
      if (now - lastTime > charTimeout) {
        buffer = '';
      }
      lastTime = now;

      if (event.key === 'Enter' || event.keyCode === 13) {
        if (event.preventDefault) {
          event.preventDefault();
        }
        const scanned = buffer;
        buffer = '';
        trigger(scanned);
        return;
      }

      if (event.key && event.key.length === 1) {
        buffer += event.key;
      }
    }

    return {
      start: function () {
        if (listening || !target) {
          return;
        }
        target.addEventListener('keydown', handleKeyDown, true);
        listening = true;
      },
      stop: function () {
        if (!listening || !target) {
          return;
        }
        target.removeEventListener('keydown', handleKeyDown, true);
        listening = false;
        buffer = '';
      },
      trigger: trigger,
    };
  }

  QMS.normalizeBarcode = normalizeBarcode;
  QMS.createScanner = createScanner;
})(typeof window !== 'undefined' ? window : globalThis);
