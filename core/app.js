/**
 * QMS bootstrap: load brand pack, wire state / scanner / audio / ui / settings.
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});

  function readBuildFlags() {
    return {
      brandId: typeof root.__QMS_BRAND_ID__ === 'string' ? root.__QMS_BRAND_ID__ : '',
      production: root.__QMS_PRODUCTION__ !== false,
    };
  }

  function locationLike() {
    return {
      search: root.location ? root.location.search : '',
      pathname: root.location ? root.location.pathname : '',
    };
  }

  function queryFlag(name) {
    if (!root.location) {
      return false;
    }
    const params = new URLSearchParams(root.location.search);
    return params.get(name) === '1' || params.get(name) === 'true';
  }

  function showBootError(message) {
    const rootEl = root.document.getElementById('qms-root');
    if (!rootEl) {
      return;
    }
    rootEl.className = 'qms-stage qms-error-stage';
    rootEl.innerHTML =
      '<div class="qms-error-card"><h1>無法載入品牌包</h1><p>' +
      String(message).replace(/</g, '&lt;') +
      '</p><p class="qms-error-hint">請用 ?brand=&lt;id&gt; 或建置旗標指定品牌。缺少品牌時不會改載其他品牌。</p></div>';
  }

  function boot() {
    const flags = readBuildFlags();
    const brandId = QMS.resolveBrandId(locationLike(), flags);
    if (!brandId) {
      showBootError('未指定品牌。請在網址加上 ?brand=guiji，或由殼層設定 __QMS_BRAND_ID__。');
      return;
    }

    QMS.loadBrandPack(brandId)
      .then(function (brand) {
        const store = QMS.createStateStore();
        store.seedReservedIds({
          storeId: brand.storeId,
          deviceId: null,
        });

        const audio = QMS.createAudioManager({
          muted:
            store.getSnapshot().prefs.muted != null
              ? store.getSnapshot().prefs.muted
              : brand.audio.mutedDefault,
        });
        audio.setBrandAudio(brand.audio);
        if (store.getSnapshot().prefs.muted == null) {
          store.setPrefs({ muted: brand.audio.mutedDefault });
        }

        const ui = QMS.createUi({ brand: brand });
        ui.render(store.getSnapshot(), { animate: false });
        ui.setAudioBadge(audio.getStatus());

        audio.subscribe(function (status) {
          ui.setAudioBadge(status);
        });

        store.subscribe(function (kind, snapshot) {
          ui.render(snapshot, {
            animate: kind === 'call' || kind === 'repeat',
            resetHistoryPage: kind === 'call' || kind === 'repeat',
          });
          if (kind === 'call' || kind === 'repeat') {
            audio.announce(snapshot.current, brand.copy.pickupHint);
          }
        });

        function applyScan(raw) {
          const code = QMS.normalizeBarcode(raw);
          if (!code) {
            return;
          }
          store.applyCall(code);
        }

        const scanner = QMS.createScanner({ onScan: applyScan });
        scanner.start();

        const settings = QMS.createSettingsController({
          buildFlags: flags,
          openStoreOnLoad: queryFlag('settings'),
          isMuted: function () {
            return audio.getStatus().muted;
          },
          onMuteToggle: function () {
            const next = !audio.getStatus().muted;
            audio.setMuted(next);
            store.setPrefs({ muted: next });
          },
          onDebugCall: applyScan,
          onClear: function () {
            store.clearQueue();
          },
        });
        settings.bind();

        const unlock = function () {
          audio.unlock();
          const video = root.document.getElementById('qms-standby-video');
          if (video && video.play) {
            video.play().catch(function () {});
          }
        };
        root.document.addEventListener('click', unlock, { once: true });
        root.document.addEventListener('keydown', unlock, { once: true });

        QMS.runtime = {
          brand: brand,
          store: store,
          audio: audio,
          ui: ui,
          settings: settings,
          applyScan: applyScan,
          setDeviceId: function (deviceId) {
            store.setDeviceId(deviceId);
          },
          setStoreId: function (storeId) {
            store.setStoreId(storeId);
          },
          getState: function () {
            return store.getSnapshot();
          },
        };

        QMS.setDeviceId = QMS.runtime.setDeviceId;
        QMS.setStoreId = QMS.runtime.setStoreId;
        QMS.getState = QMS.runtime.getState;
        QMS.applyScan = applyScan;

        if (typeof root.__QMS_DEVICE_ID__ === 'string' && root.__QMS_DEVICE_ID__) {
          store.setDeviceId(root.__QMS_DEVICE_ID__);
        }
      })
      .catch(function (error) {
        showBootError(error && error.message ? error.message : String(error));
      });
  }

  QMS.boot = boot;

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
