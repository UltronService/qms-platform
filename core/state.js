/**
 * Runtime queue state.
 * Single key qms_state_v1, shape aligned with guiji_qms_state_v1:
 * version, current, history, prefs, storeId/deviceId, updatedAt.
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});
  const STORAGE_KEY = 'qms_state_v1';
  const LEGACY_UNIFIED_KEY = 'guiji_qms_state_v1';
  const LEGACY_V2_KEY = 'GUIJI_QMS_CALLING_DATA_V2';
  const LEGACY_MAIN_KEY = 'guiji_main_number';
  const LEGACY_HISTORY_KEY = 'guiji_history';
  const LEGACY_LAYOUT_KEY = 'guiji_history_layout';
  const LEGACY_OPACITY_KEY = 'guiji_banner_opacity';
  const LEGACY_FONT_KEY = 'guiji_font_pref';
  const EMPTY_CURRENT_TOKENS = ['', '---', '等待叫號', 'null', 'undefined'];

  /**
   * @returns {QmsState}
   */
  function createEmptyState() {
    return {
      version: 1,
      current: null,
      history: [],
      prefs: {
        historyOrientation: null,
        bannerOpacity: null,
        muted: null,
        font: null,
      },
      storeId: null,
      deviceId: null,
      updatedAt: 0,
    };
  }

  /**
   * @param {unknown} value
   * @returns {string | null}
   */
  function normalizeCurrent(value) {
    if (value == null) {
      return null;
    }
    const text = String(value).trim();
    if (!text) {
      return null;
    }
    if (EMPTY_CURRENT_TOKENS.indexOf(text) !== -1) {
      return null;
    }
    return text;
  }

  /**
   * @param {unknown} value
   * @returns {string[]}
   */
  function normalizeHistory(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    const result = [];
    for (let i = 0; i < value.length; i += 1) {
      const item = normalizeCurrent(value[i]);
      if (item && result.indexOf(item) === -1) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * @param {unknown} raw
   * @returns {QmsState | null}
   */
  function parseStateObject(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const data = /** @type {Record<string, unknown>} */ (raw);
    const prefsRaw =
      data.prefs && typeof data.prefs === 'object'
        ? /** @type {Record<string, unknown>} */ (data.prefs)
        : {};
    const orientation =
      prefsRaw.historyOrientation === 'vertical' || prefsRaw.historyOrientation === 'horizontal'
        ? prefsRaw.historyOrientation
        : null;
    const bannerOpacity =
      typeof prefsRaw.bannerOpacity === 'number' && Number.isFinite(prefsRaw.bannerOpacity)
        ? prefsRaw.bannerOpacity
        : null;

    return {
      version: 1,
      current: normalizeCurrent(data.current != null ? data.current : data.currentNumber),
      history: normalizeHistory(data.history != null ? data.history : data.historyNumbers),
      prefs: {
        historyOrientation: orientation,
        bannerOpacity: bannerOpacity,
        muted: typeof prefsRaw.muted === 'boolean' ? prefsRaw.muted : null,
        font: typeof prefsRaw.font === 'string' ? prefsRaw.font : null,
      },
      storeId: data.storeId == null || data.storeId === '' ? null : String(data.storeId),
      deviceId: data.deviceId == null || data.deviceId === '' ? null : String(data.deviceId),
      updatedAt: Number(data.updatedAt) || 0,
    };
  }

  /**
   * @param {Storage} storage
   * @param {string} key
   * @returns {unknown}
   */
  function readJson(storage, key) {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {Storage} storage
   * @returns {QmsState}
   */
  function migrateLegacyState(storage) {
    const unified = parseStateObject(readJson(storage, LEGACY_UNIFIED_KEY));
    if (unified) {
      return unified;
    }

    const v2 = parseStateObject(readJson(storage, LEGACY_V2_KEY));
    if (v2) {
      return v2;
    }

    const migrated = createEmptyState();
    try {
      migrated.current = normalizeCurrent(storage.getItem(LEGACY_MAIN_KEY));
    } catch (error) {
      migrated.current = null;
    }

    try {
      const historyRaw = storage.getItem(LEGACY_HISTORY_KEY);
      if (historyRaw) {
        migrated.history = normalizeHistory(JSON.parse(historyRaw));
      }
    } catch (error) {
      migrated.history = [];
    }

    try {
      const layout = storage.getItem(LEGACY_LAYOUT_KEY);
      if (layout === 'vertical' || layout === 'horizontal') {
        migrated.prefs.historyOrientation = layout;
      }
    } catch (error) {
      /* ignore */
    }

    try {
      const opacity = storage.getItem(LEGACY_OPACITY_KEY);
      if (opacity != null && opacity !== '') {
        const parsed = Number(opacity);
        if (Number.isFinite(parsed)) {
          migrated.prefs.bannerOpacity = parsed;
        }
      }
    } catch (error) {
      /* ignore */
    }

    try {
      const font = storage.getItem(LEGACY_FONT_KEY);
      if (font) {
        migrated.prefs.font = font;
      }
    } catch (error) {
      /* ignore */
    }

    const hasLegacy =
      migrated.current != null ||
      migrated.history.length > 0 ||
      migrated.prefs.historyOrientation != null ||
      migrated.prefs.bannerOpacity != null ||
      migrated.prefs.font != null;

    return hasLegacy ? migrated : createEmptyState();
  }

  /**
   * @param {Storage} storage
   * @returns {QmsState}
   */
  function loadState(storage) {
    const current = parseStateObject(readJson(storage, STORAGE_KEY));
    if (current) {
      return current;
    }
    return migrateLegacyState(storage);
  }

  /**
   * @param {Storage} storage
   * @param {QmsState} state
   */
  function persistState(storage, state) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* quota / private mode */
    }
  }

  /**
   * @param {QmsState} snapshot
   * @param {string} code
   * @returns {{ snapshot: QmsState, kind: 'ignored' | 'repeat' | 'call' }}
   */
  function applyCallToSnapshot(snapshot, code) {
    if (!code) {
      return { snapshot: snapshot, kind: 'ignored' };
    }

    if (snapshot.current === code) {
      return { snapshot: snapshot, kind: 'repeat' };
    }

    const history = [];
    for (let i = 0; i < snapshot.history.length; i += 1) {
      if (snapshot.history[i] !== code) {
        history.push(snapshot.history[i]);
      }
    }

    if (snapshot.current) {
      history.unshift(snapshot.current);
    }

    return {
      snapshot: Object.assign({}, snapshot, {
        current: code,
        history: history,
        updatedAt: Date.now(),
      }),
      kind: 'call',
    };
  }

  /**
   * @param {QmsState} snapshot
   * @returns {QmsState}
   */
  function clearQueueSnapshot(snapshot) {
    return Object.assign({}, snapshot, {
      current: null,
      history: [],
      updatedAt: Date.now(),
    });
  }

  /**
   * @param {object} [options]
   */
  function createStateStore(options) {
    const opts = options || {};
    const storage = opts.storage || (typeof root.localStorage !== 'undefined' ? root.localStorage : null);
    const memory = { data: {} };
    const fallbackStorage = {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(memory.data, key) ? memory.data[key] : null;
      },
      setItem: function (key, value) {
        memory.data[key] = String(value);
      },
      removeItem: function (key) {
        delete memory.data[key];
      },
    };
    const store = storage || fallbackStorage;
    let state = loadState(store);
    persistState(store, state);
    const listeners = [];

    function emit(kind) {
      const snapshot = getSnapshot();
      for (let i = 0; i < listeners.length; i += 1) {
        listeners[i](kind, snapshot);
      }
    }

    function commit(next, kind) {
      state = next;
      persistState(store, state);
      emit(kind);
      return state;
    }

    function getSnapshot() {
      return {
        version: 1,
        current: state.current,
        history: state.history.slice(),
        prefs: {
          historyOrientation: state.prefs.historyOrientation,
          bannerOpacity: state.prefs.bannerOpacity,
          muted: state.prefs.muted,
          font: state.prefs.font,
        },
        storeId: state.storeId,
        deviceId: state.deviceId,
        updatedAt: state.updatedAt,
      };
    }

    return {
      getSnapshot: getSnapshot,
      subscribe: function (listener) {
        if (typeof listener !== 'function') {
          return function () {};
        }
        listeners.push(listener);
        return function () {
          const index = listeners.indexOf(listener);
          if (index >= 0) {
            listeners.splice(index, 1);
          }
        };
      },
      applyCall: function (code) {
        const result = applyCallToSnapshot(state, code);
        if (result.kind === 'ignored') {
          return result;
        }
        if (result.kind === 'repeat') {
          emit('repeat');
          return result;
        }
        commit(result.snapshot, 'call');
        return result;
      },
      clearQueue: function () {
        commit(clearQueueSnapshot(state), 'clear');
      },
      setPrefs: function (partial) {
        const nextPrefs = Object.assign({}, state.prefs, partial || {});
        commit(
          Object.assign({}, state, { prefs: nextPrefs, updatedAt: Date.now() }),
          'prefs'
        );
      },
      setStoreId: function (storeId) {
        const value = storeId == null || storeId === '' ? null : String(storeId);
        if (state.storeId === value) {
          return;
        }
        commit(Object.assign({}, state, { storeId: value, updatedAt: Date.now() }), 'ids');
      },
      setDeviceId: function (deviceId) {
        const value = deviceId == null || deviceId === '' ? null : String(deviceId);
        if (state.deviceId === value) {
          return;
        }
        commit(Object.assign({}, state, { deviceId: value, updatedAt: Date.now() }), 'ids');
      },
      seedReservedIds: function (brand) {
        if (!brand) {
          return;
        }
        let changed = false;
        const next = Object.assign({}, state);
        if (!next.storeId && brand.storeId) {
          next.storeId = String(brand.storeId);
          changed = true;
        }
        if (!next.deviceId && brand.deviceId) {
          next.deviceId = String(brand.deviceId);
          changed = true;
        }
        if (!changed) {
          return;
        }
        next.updatedAt = Date.now();
        commit(next, 'ids');
      },
    };
  }

  QMS.STORAGE_KEY = STORAGE_KEY;
  QMS.LEGACY_UNIFIED_KEY = LEGACY_UNIFIED_KEY;
  QMS.createEmptyState = createEmptyState;
  QMS.parseStateObject = parseStateObject;
  QMS.migrateLegacyState = migrateLegacyState;
  QMS.loadState = loadState;
  QMS.applyCallToSnapshot = applyCallToSnapshot;
  QMS.clearQueueSnapshot = clearQueueSnapshot;
  QMS.createStateStore = createStateStore;
})(typeof window !== 'undefined' ? window : globalThis);
