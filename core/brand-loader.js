/**
 * Brand pack loader.
 * Resolves brandId from URL query/path or build flag, then reads
 * brands/<brandId>/brand.json and relative assets. Missing brand is an error.
 */
(function (root) {
  'use strict';

  const QMS = (root.QMS = root.QMS || {});
  const REQUIRED_FIELDS = [
    'version',
    'brandId',
    'displayName',
    'layout',
    'theme',
    'copy',
    'queue',
    'audio',
    'assets',
  ];
  const KNOWN_LAYOUTS = ['portrait-menu', 'landscape-queue'];
  const STANDBY_FALLBACKS = ['logo-on-primary'];

  /**
   * @param {string} message
   * @param {string} [brandId]
   */
  function BrandLoadError(message, brandId) {
    const error = new Error(message);
    error.name = 'BrandLoadError';
    error.brandId = brandId || null;
    return error;
  }

  /**
   * @param {{ search?: string, pathname?: string }} locationLike
   * @param {{ brandId?: string }} [buildFlags]
   * @returns {string | null}
   */
  function resolveBrandId(locationLike, buildFlags) {
    const loc = locationLike || {};
    const flags = buildFlags || {};
    const search = loc.search || '';
    const params = new URLSearchParams(search.charAt(0) === '?' ? search.slice(1) : search);
    const fromQuery = (params.get('brand') || params.get('brandId') || '').trim();
    if (fromQuery) {
      return fromQuery;
    }

    const pathname = String(loc.pathname || '').replace(/\\/g, '/');
    const parts = pathname.split('/').filter(function (part) {
      return part && part !== 'index.html';
    });
    const brandsIndex = parts.lastIndexOf('brands');
    if (brandsIndex >= 0 && parts[brandsIndex + 1]) {
      return parts[brandsIndex + 1];
    }

    const fromFlag = typeof flags.brandId === 'string' ? flags.brandId.trim() : '';
    if (fromFlag) {
      return fromFlag;
    }

    return null;
  }

  /**
   * @param {{ layout?: string, queue?: { historyOrientation?: string } }} brand
   * @param {{ search?: string }} locationLike
   */
  function applyPreviewOverrides(brand, locationLike) {
    const loc = locationLike || {};
    const search = loc.search || '';
    const params = new URLSearchParams(search.charAt(0) === '?' ? search.slice(1) : search);
    const layout = (params.get('layout') || '').trim();
    if (KNOWN_LAYOUTS.indexOf(layout) !== -1) {
      brand.layout = layout;
    }
    const history = (params.get('history') || '').trim();
    if (history === 'vertical' || history === 'horizontal') {
      if (brand.queue) {
        brand.queue.historyOrientation = history;
      }
    }
  }

  /**
   * @param {string} brandId
   * @returns {string}
   */
  function brandBasePath(brandId) {
    return 'brands/' + encodeURIComponent(brandId);
  }

  /**
   * @param {string} base
   * @param {string | null | undefined} relative
   * @returns {string | null}
   */
  function resolveAssetPath(base, relative) {
    if (!relative || typeof relative !== 'string') {
      return null;
    }
    const trimmed = relative.trim();
    if (!trimmed) {
      return null;
    }
    if (/^(https?:|data:|file:|blob:)/i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.charAt(0) === '/') {
      return trimmed;
    }
    return base.replace(/\/+$/, '') + '/' + trimmed.replace(/^\/+/, '');
  }

  /**
   * @param {unknown} data
   * @param {string} brandId
   */
  function validateBrand(data, brandId) {
    if (!data || typeof data !== 'object') {
      throw BrandLoadError('品牌包內容無效（不是 JSON 物件）', brandId);
    }

    const brand = /** @type {Record<string, unknown>} */ (data);
    for (let i = 0; i < REQUIRED_FIELDS.length; i += 1) {
      const field = REQUIRED_FIELDS[i];
      if (brand[field] === undefined || brand[field] === null) {
        throw BrandLoadError('品牌包缺少必要欄位：' + field, brandId);
      }
    }

    if (typeof brand.brandId !== 'string' || !brand.brandId.trim()) {
      throw BrandLoadError('brandId 無效', brandId);
    }

    if (KNOWN_LAYOUTS.indexOf(String(brand.layout)) === -1) {
      throw BrandLoadError(
        '未知版型 layout=' + String(brand.layout) + '（僅支援 portrait-menu / landscape-queue）',
        brandId
      );
    }

    const theme = /** @type {Record<string, unknown>} */ (brand.theme);
    if (!theme.primary || !theme.accent) {
      throw BrandLoadError('theme.primary / theme.accent 為必要欄位', brandId);
    }

    const copy = /** @type {Record<string, unknown>} */ (brand.copy);
    if (!copy.pickupHint) {
      throw BrandLoadError('copy.pickupHint 為必要欄位', brandId);
    }

    const standbyFallback = copy.standbyFallback ? String(copy.standbyFallback) : 'logo-on-primary';
    if (STANDBY_FALLBACKS.indexOf(standbyFallback) === -1) {
      throw BrandLoadError('copy.standbyFallback 僅支援 logo-on-primary', brandId);
    }

    return brand;
  }

  /**
   * @param {Record<string, unknown>} brand
   * @param {string} base
   */
  function normalizeBrand(brand, base) {
    const theme = /** @type {Record<string, unknown>} */ (brand.theme || {});
    const copy = /** @type {Record<string, unknown>} */ (brand.copy || {});
    const queue = /** @type {Record<string, unknown>} */ (brand.queue || {});
    const audio = /** @type {Record<string, unknown>} */ (brand.audio || {});
    const assets = /** @type {Record<string, unknown>} */ (brand.assets || {});

    const bannerOpacityMin = Number(theme.bannerOpacityMin);
    const minOpacity = Number.isFinite(bannerOpacityMin) ? bannerOpacityMin : 0.75;
    const bannerOpacityRaw = Number(theme.bannerOpacity);
    const bannerOpacity = Number.isFinite(bannerOpacityRaw) ? bannerOpacityRaw : 0.85;

    const historyMaxRaw = Number(queue.historyMax);
    const historyOrientation =
      queue.historyOrientation === 'vertical' ? 'vertical' : 'horizontal';

    return {
      version: Number(brand.version) || 1,
      brandId: String(brand.brandId),
      displayName: String(brand.displayName),
      layout: String(brand.layout),
      theme: {
        primary: String(theme.primary),
        accent: String(theme.accent),
        bannerOpacity: Math.max(minOpacity, Math.min(1, bannerOpacity)),
        bannerOpacityMin: minOpacity,
      },
      copy: {
        pickupHint: String(copy.pickupHint),
        standbyFallback: 'logo-on-primary',
      },
      queue: {
        historyMax: Number.isFinite(historyMaxRaw) && historyMaxRaw > 0 ? historyMaxRaw : 2,
        historyOrientation: historyOrientation,
        mainNumberMaxLenForLargeFont:
          Number(queue.mainNumberMaxLenForLargeFont) > 0
            ? Number(queue.mainNumberMaxLenForLargeFont)
            : 4,
      },
      audio: {
        tts: audio.tts !== false,
        dingDong: audio.dingDong !== false,
        mutedDefault: audio.mutedDefault === true,
      },
      assets: {
        logo: resolveAssetPath(base, assets.logo ? String(assets.logo) : null),
        menuImage: resolveAssetPath(base, assets.menuImage ? String(assets.menuImage) : null),
        standbyVideo: resolveAssetPath(
          base,
          assets.standbyVideo ? String(assets.standbyVideo) : null
        ),
      },
      storeId: brand.storeId == null ? null : String(brand.storeId),
      deviceId: brand.deviceId == null ? null : String(brand.deviceId),
      basePath: base,
    };
  }

  /**
   * @param {string} brandId
   * @param {{ fetchFn?: typeof fetch }} [options]
   */
  function loadBrandPack(brandId, options) {
    const opts = options || {};
    if (!brandId || !String(brandId).trim()) {
      return Promise.reject(
        BrandLoadError('未指定品牌。請用 ?brand=<id>、路徑 /brands/<id>，或建置旗標 __QMS_BRAND_ID__。')
      );
    }

    const id = String(brandId).trim();
    const base = brandBasePath(id);
    const url = base + '/brand.json';
    const fetchFn = opts.fetchFn || root.fetch;

    if (typeof fetchFn !== 'function') {
      return Promise.reject(BrandLoadError('此環境無法讀取品牌包（缺少 fetch）', id));
    }

    return fetchFn(url, { cache: 'no-cache' })
      .then(function (response) {
        if (!response || !response.ok) {
          const status = response ? response.status : 0;
          throw BrandLoadError(
            '找不到品牌包「' + id + '」（' + url + (status ? ', HTTP ' + status : '') + '）。不會改載其他品牌。',
            id
          );
        }
        return response.json();
      })
      .catch(function (error) {
        if (error && error.name === 'BrandLoadError') {
          throw error;
        }
        throw BrandLoadError(
          '無法載入品牌包「' + id + '」：' + (error && error.message ? error.message : String(error)),
          id
        );
      })
      .then(function (data) {
        const validated = validateBrand(data, id);
        const normalized = normalizeBrand(validated, base);
        const locationLike =
          root.location != null
            ? { search: root.location.search }
            : opts.locationLike || { search: '' };
        applyPreviewOverrides(normalized, locationLike);
        return normalized;
      });
  }

  QMS.BrandLoadError = BrandLoadError;
  QMS.KNOWN_LAYOUTS = KNOWN_LAYOUTS;
  QMS.resolveBrandId = resolveBrandId;
  QMS.applyPreviewOverrides = applyPreviewOverrides;
  QMS.brandBasePath = brandBasePath;
  QMS.resolveAssetPath = resolveAssetPath;
  QMS.validateBrand = validateBrand;
  QMS.normalizeBrand = normalizeBrand;
  QMS.loadBrandPack = loadBrandPack;
})(typeof window !== 'undefined' ? window : globalThis);
