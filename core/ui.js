/**
 * Layout UI: portrait-menu (1080×1920) vs landscape-queue (1920×1080).
 * Theme/copy/queue/assets come from the loaded brand pack.
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});

  /**
   * @param {string} layout
   * @returns {'portrait-menu' | 'landscape-queue'}
   */
  function resolveLayout(layout) {
    switch (layout) {
      case 'portrait-menu':
        return 'portrait-menu';
      case 'landscape-queue':
        return 'landscape-queue';
      default: {
        const unexpected = layout;
        throw new Error('未知版型：' + unexpected);
      }
    }
  }

  /**
   * @param {number} length
   * @param {number} maxLen
   * @param {boolean} landscape
   * @returns {string}
   */
  function mainFontSize(length, maxLen, landscape) {
    const limit = maxLen > 0 ? maxLen : 4;
    if (length <= limit) {
      return landscape ? '168px' : '132px';
    }
    if (length <= limit + 2) {
      return landscape ? '128px' : '104px';
    }
    return landscape ? '88px' : '76px';
  }

  /**
   * @param {ParentNode} parent
   * @param {string} html
   */
  function setHtml(parent, html) {
    parent.innerHTML = html;
  }

  /**
   * @param {object} options
   */
  function createUi(options) {
    const opts = options || {};
    const doc = opts.document || root.document;
    const rootEl = opts.root || (doc ? doc.getElementById('qms-root') : null);

    if (!doc || !rootEl) {
      throw new Error('UI 需要 #qms-root');
    }

    let brand = opts.brand;
    const layout = resolveLayout(brand.layout);
    const landscape = layout === 'landscape-queue';
    const canvasWidth = landscape ? 1920 : 1080;
    const canvasHeight = landscape ? 1080 : 1920;

    function asset(kind) {
      return brand.assets && brand.assets[kind] ? brand.assets[kind] : '';
    }

    function renderShell() {
      const logoSrc = asset('logo');
      const menuSrc = asset('menuImage');
      const videoSrc = asset('standbyVideo');
      const hint = brand.copy.pickupHint;
      const displayName = brand.displayName;

      const videoTag = videoSrc
        ? '<video class="qms-media-video" id="qms-standby-video" autoplay loop muted playsinline preload="metadata">' +
          '<source src="' + videoSrc + '"></video>'
        : '';

      const logoTag = logoSrc
        ? '<img class="qms-logo" id="qms-logo" src="' + logoSrc + '" alt="' + displayName + '">'
        : '<div class="qms-logo qms-logo-fallback" id="qms-logo">' + displayName + '</div>';

      const menuTag = menuSrc
        ? '<img class="qms-menu-image" id="qms-menu-image" src="' + menuSrc + '" alt="' + displayName + ' 菜單">'
        : '';

      const panels =
        '<aside class="qms-panel qms-store-panel" id="qms-store-panel" hidden>' +
        '<div class="qms-panel-head"><h2>門市設定</h2><button type="button" id="qms-store-close">關閉</button></div>' +
        '<p class="qms-panel-note">長按 Logo 開啟。正式包不提供測試叫號。</p>' +
        '<button type="button" id="qms-store-mute">靜音：關</button>' +
        '<dl class="qms-meta"><dt>storeId</dt><dd id="qms-store-id">—</dd><dt>deviceId</dt><dd id="qms-device-id">—</dd></dl>' +
        '</aside>' +
        '<aside class="qms-panel qms-debug-panel" id="qms-debug-panel" hidden>' +
        '<div class="qms-panel-head"><h2>Debug</h2><button type="button" id="qms-debug-close">關閉</button></div>' +
        '<p class="qms-panel-note">僅非 production 建置可用（T / 雙擊 / Demo）。</p>' +
        '<div class="qms-debug-row"><input id="qms-debug-input" type="text" placeholder="號碼" autocomplete="off">' +
        '<button type="button" id="qms-debug-call">叫號</button></div>' +
        '<div class="qms-debug-row"><button type="button" id="qms-debug-demo">Demo：關</button>' +
        '<button type="button" id="qms-debug-clear">清空</button></div>' +
        '</aside>';

      const badge =
        '<div class="qms-audio-badge" id="qms-audio-badge" hidden>靜音</div>';

      const callBlock =
        '<div class="qms-call-block">' +
        '<div class="qms-main-number" id="qms-main-number"></div>' +
        '<div class="qms-pickup-hint" id="qms-pickup-hint">' + hint + '</div>' +
        '</div>' +
        '<div class="qms-history" id="qms-history"></div>';

      let inner = '';
      switch (layout) {
        case 'portrait-menu':
          inner =
            '<div class="qms-canvas" id="qms-canvas">' +
            '<section class="qms-banner" id="qms-banner">' +
            '<div class="qms-banner-fill"></div>' +
            videoTag +
            '<div class="qms-banner-content">' +
            '<div class="qms-logo-wrap" id="qms-logo-hit">' + logoTag + '</div>' +
            callBlock +
            '</div>' +
            badge +
            '</section>' +
            '<section class="qms-menu" id="qms-menu">' +
            menuTag +
            '<div class="qms-menu-fallback" id="qms-menu-fallback"' + (menuSrc ? ' hidden' : '') + '>' +
            displayName + '<span>菜單素材待補</span></div>' +
            '</section>' +
            panels +
            '</div>';
          break;
        case 'landscape-queue':
          inner =
            '<div class="qms-canvas" id="qms-canvas">' +
            '<section class="qms-ad" id="qms-ad">' +
            videoTag +
            menuTag +
            '<div class="qms-menu-fallback" id="qms-menu-fallback"' + (menuSrc || videoSrc ? ' hidden' : '') + '>' +
            displayName + '<span>廣告素材待補</span></div>' +
            '</section>' +
            '<section class="qms-queue-wall" id="qms-queue-wall">' +
            '<div class="qms-banner-fill"></div>' +
            '<div class="qms-banner-content">' +
            '<div class="qms-logo-wrap" id="qms-logo-hit">' + logoTag + '</div>' +
            callBlock +
            '</div>' +
            badge +
            '</section>' +
            panels +
            '</div>';
          break;
        default: {
          const unexpected = layout;
          throw new Error('未知版型：' + unexpected);
        }
      }

      rootEl.className = 'qms-stage layout-' + layout;
      setHtml(rootEl, inner);
      applyTheme();
      bindMediaFallbacks();
      scaleCanvas();
    }

    function applyTheme() {
      const theme = brand.theme;
      const host = doc.documentElement;
      host.style.setProperty('--qms-primary', theme.primary);
      host.style.setProperty('--qms-accent', theme.accent);
      host.style.setProperty('--qms-banner-opacity', String(theme.bannerOpacity));
      if (doc.body) {
        doc.body.style.background = theme.primary;
      }
      if (doc.title !== undefined) {
        doc.title = brand.displayName + ' 叫號';
      }
    }

    function bindMediaFallbacks() {
      const menuImage = doc.getElementById('qms-menu-image');
      const fallback = doc.getElementById('qms-menu-fallback');
      if (menuImage && fallback) {
        menuImage.addEventListener('error', function () {
          menuImage.hidden = true;
          fallback.hidden = false;
        });
      }
      const video = doc.getElementById('qms-standby-video');
      if (video) {
        video.addEventListener('error', function () {
          video.hidden = true;
        });
        video.addEventListener('loadeddata', function () {
          video.play().catch(function () {});
        });
      }
      const logo = doc.getElementById('qms-logo');
      if (logo && logo.tagName === 'IMG') {
        logo.addEventListener('error', function () {
          const fallbackLogo = doc.createElement('div');
          fallbackLogo.className = 'qms-logo qms-logo-fallback';
          fallbackLogo.id = 'qms-logo';
          fallbackLogo.textContent = brand.displayName;
          if (logo.parentNode) {
            logo.parentNode.replaceChild(fallbackLogo, logo);
          }
        });
      }
    }

    function scaleCanvas() {
      const canvas = doc.getElementById('qms-canvas');
      if (!canvas) {
        return;
      }
      const scale = Math.min(root.innerWidth / canvasWidth, root.innerHeight / canvasHeight);
      canvas.style.transform = 'scale(' + scale + ')';
    }

    function historyOrientation(snapshot) {
      return snapshot.prefs.historyOrientation || brand.queue.historyOrientation || 'horizontal';
    }

    function bannerOpacity(snapshot) {
      const min = brand.theme.bannerOpacityMin;
      const preferred =
        snapshot.prefs.bannerOpacity != null ? snapshot.prefs.bannerOpacity : brand.theme.bannerOpacity;
      return Math.max(min, Math.min(1, preferred));
    }

    /**
     * @param {object} snapshot
     * @param {{ animate?: boolean }} [flags]
     */
    function render(snapshot, flags) {
      const animate = flags && flags.animate;
      const standby = !snapshot.current;
      const banner = doc.getElementById('qms-banner') || doc.getElementById('qms-queue-wall');
      const main = doc.getElementById('qms-main-number');
      const hint = doc.getElementById('qms-pickup-hint');
      const historyEl = doc.getElementById('qms-history');
      const storeIdEl = doc.getElementById('qms-store-id');
      const deviceIdEl = doc.getElementById('qms-device-id');

      doc.documentElement.style.setProperty('--qms-banner-opacity', String(bannerOpacity(snapshot)));

      if (banner) {
        if (standby) {
          banner.classList.add('is-standby');
          banner.classList.remove('is-calling');
        } else {
          banner.classList.remove('is-standby');
          banner.classList.add('is-calling');
        }
      }

      if (historyEl) {
        historyEl.classList.toggle('is-vertical', historyOrientation(snapshot) === 'vertical');
      }

      if (main) {
        main.textContent = snapshot.current || '';
        main.style.fontSize = mainFontSize(
          snapshot.current ? snapshot.current.length : 0,
          brand.queue.mainNumberMaxLenForLargeFont,
          landscape
        );
        if (animate && snapshot.current) {
          main.classList.remove('is-pop');
          void main.offsetWidth;
          main.classList.add('is-pop');
        }
      }

      if (hint) {
        hint.textContent = brand.copy.pickupHint;
        hint.hidden = standby;
      }

      if (historyEl) {
        const max = brand.queue.historyMax;
        const items = snapshot.history.slice(0, max);
        historyEl.innerHTML = items
          .map(function (num) {
            return '<span class="qms-history-item">' + num + '</span>';
          })
          .join('');
      }

      if (storeIdEl) {
        storeIdEl.textContent = snapshot.storeId || '—';
      }
      if (deviceIdEl) {
        deviceIdEl.textContent = snapshot.deviceId || '—';
      }
    }

    /**
     * @param {{ muted: boolean, ttsFailed: boolean, dingDongFailed: boolean }} audioStatus
     */
    function setAudioBadge(audioStatus) {
      const badge = doc.getElementById('qms-audio-badge');
      if (!badge) {
        return;
      }
      if (audioStatus.muted) {
        badge.hidden = false;
        badge.textContent = '靜音';
        return;
      }
      if (audioStatus.ttsFailed || audioStatus.dingDongFailed) {
        badge.hidden = false;
        badge.textContent = audioStatus.ttsFailed ? '語音失敗' : '音效失敗';
        return;
      }
      badge.hidden = true;
    }

    function showFatalError(message) {
      rootEl.className = 'qms-stage qms-error-stage';
      setHtml(
        rootEl,
        '<div class="qms-error-card">' +
          '<h1>無法載入品牌包</h1>' +
          '<p>' +
          String(message).replace(/</g, '&lt;') +
          '</p>' +
          '<p class="qms-error-hint">請確認 brands/&lt;brandId&gt;/brand.json 存在。系統不會改載其他品牌。</p>' +
          '</div>'
      );
    }

    if (typeof root.addEventListener === 'function') {
      root.addEventListener('resize', scaleCanvas);
    }

    renderShell();

    return {
      layout: layout,
      render: render,
      setAudioBadge: setAudioBadge,
      showFatalError: showFatalError,
      scaleCanvas: scaleCanvas,
    };
  }

  QMS.resolveLayout = resolveLayout;
  QMS.mainFontSize = mainFontSize;
  QMS.createUi = createUi;
})(typeof window !== 'undefined' ? window : globalThis);
