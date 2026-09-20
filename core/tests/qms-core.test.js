'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCore() {
  const sandbox = {
    console: console,
    URLSearchParams: URLSearchParams,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    JSON: JSON,
    Object: Object,
    Number: Number,
    String: String,
    Array: Array,
    Math: Math,
    Promise: Promise,
    Error: Error,
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  const files = [
    'brand-loader.js',
    'state.js',
    'scanner.js',
    'audio.js',
    'settings.js',
    'ui.js',
  ];
  files.forEach(function (file) {
    const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    vm.runInNewContext(code, sandbox, { filename: file });
  });
  return sandbox.QMS;
}

function memoryStorage(initial) {
  const data = Object.assign({}, initial || {});
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem: function (key, value) {
      data[key] = String(value);
    },
    removeItem: function (key) {
      delete data[key];
    },
    dump: function () {
      return data;
    },
  };
}

const sampleBrand = {
  version: 1,
  brandId: 'guiji',
  displayName: '龜記',
  layout: 'portrait-menu',
  theme: {
    primary: '#006B3F',
    accent: '#DBEE0F',
    bannerOpacity: 0.85,
    bannerOpacityMin: 0.75,
  },
  copy: {
    pickupHint: '請取餐',
    standbyFallback: 'logo-on-primary',
  },
  queue: {
    historyMax: 2,
    historyOrientation: 'horizontal',
    mainNumberMaxLenForLargeFont: 4,
  },
  audio: {
    tts: true,
    dingDong: true,
    mutedDefault: false,
  },
  assets: {
    logo: 'assets/logo.svg',
    menuImage: 'assets/menu.jpg',
    standbyVideo: 'assets/standby.webm',
  },
  storeId: null,
  deviceId: null,
};

test('brandId comes from query, then path, then build flag; missing is null', function () {
  const QMS = loadCore();
  assert.equal(
    QMS.resolveBrandId({ search: '?brand=guiji', pathname: '/' }, { brandId: 'other' }),
    'guiji'
  );
  assert.equal(
    QMS.resolveBrandId({ search: '', pathname: '/brands/tea-top/index.html' }, {}),
    'tea-top'
  );
  assert.equal(QMS.resolveBrandId({ search: '', pathname: '/' }, { brandId: 'guiji' }), 'guiji');
  assert.equal(QMS.resolveBrandId({ search: '', pathname: '/' }, {}), null);
});

test('missing brand pack is a hard error and does not fall back', async function () {
  const QMS = loadCore();
  await assert.rejects(
    function () {
      return QMS.loadBrandPack('missing-brand', {
        fetchFn: function () {
          return Promise.resolve({ ok: false, status: 404, json: function () {} });
        },
      });
    },
    function (error) {
      assert.equal(error.name, 'BrandLoadError');
      assert.match(error.message, /missing-brand/);
      assert.match(error.message, /不會改載其他品牌/);
      return true;
    }
  );
});

test('empty brandId does not silently load guiji', async function () {
  const QMS = loadCore();
  await assert.rejects(
    function () {
      return QMS.loadBrandPack('', {
        fetchFn: function () {
          throw new Error('should not fetch');
        },
      });
    },
    /未指定品牌/
  );
});

test('validate + normalize guiji brand.json fixture', function () {
  const QMS = loadCore();
  const validated = QMS.validateBrand(sampleBrand, 'guiji');
  const normalized = QMS.normalizeBrand(validated, 'brands/guiji');
  assert.equal(normalized.layout, 'portrait-menu');
  assert.equal(normalized.queue.historyMax, 2);
  assert.equal(normalized.copy.standbyFallback, 'logo-on-primary');
  assert.equal(normalized.assets.logo, 'brands/guiji/assets/logo.svg');
  assert.equal(normalized.theme.bannerOpacityMin, 0.75);
});

test('unknown layout is rejected', function () {
  const QMS = loadCore();
  assert.throws(function () {
    QMS.validateBrand(Object.assign({}, sampleBrand, { layout: 'tablet-grid' }), 'guiji');
  }, /未知版型/);
});

test('barcode normalize pads digits and keeps prefixes', function () {
  const QMS = loadCore();
  assert.equal(QMS.normalizeBarcode(' 88 '), '088');
  assert.equal(QMS.normalizeBarcode('0321'), '321');
  assert.equal(QMS.normalizeBarcode('a01'), 'A01');
  assert.equal(QMS.normalizeBarcode(''), '');
});

test('applyCall keeps 1 current + historyMax and repeats in place', function () {
  const QMS = loadCore();
  const empty = QMS.createEmptyState();
  const first = QMS.applyCallToSnapshot(empty, '001', 3);
  assert.equal(first.kind, 'call');
  assert.equal(first.snapshot.current, '001');
  const second = QMS.applyCallToSnapshot(first.snapshot, '002', 3);
  const third = QMS.applyCallToSnapshot(second.snapshot, '003', 3);
  const fourth = QMS.applyCallToSnapshot(third.snapshot, '004', 3);
  assert.equal(fourth.snapshot.history.join(','), '003,002,001');
  const repeat = QMS.applyCallToSnapshot(fourth.snapshot, '004', 3);
  assert.equal(repeat.kind, 'repeat');
  assert.equal(repeat.snapshot.current, '004');
});

test('migrates legacy guiji keys into qms_state_v1', function () {
  const QMS = loadCore();
  const storage = memoryStorage({
    guiji_main_number: '088',
    guiji_history: JSON.stringify(['087', '086']),
    guiji_history_layout: 'horizontal',
    guiji_banner_opacity: '0.85',
  });
  const store = QMS.createStateStore({ storage: storage });
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.current, '088');
  assert.equal(snapshot.history.join(','), '087,086');
  assert.equal(snapshot.prefs.historyOrientation, 'horizontal');
  assert.ok(storage.getItem(QMS.STORAGE_KEY));
});

test('migrates guiji_qms_state_v1 unified key', function () {
  const QMS = loadCore();
  const storage = memoryStorage({
    guiji_qms_state_v1: JSON.stringify({
      version: 1,
      current: 'A01',
      history: ['A00'],
      prefs: { muted: true },
      storeId: 'store-1',
      deviceId: null,
      updatedAt: 1,
    }),
  });
  const store = QMS.createStateStore({ storage: storage });
  assert.equal(store.getSnapshot().current, 'A01');
  assert.equal(store.getSnapshot().prefs.muted, true);
  assert.equal(store.getSnapshot().storeId, 'store-1');
});

test('deviceId injection does not change brand theme fields', function () {
  const QMS = loadCore();
  const brand = QMS.normalizeBrand(sampleBrand, 'brands/guiji');
  const store = QMS.createStateStore({ storage: memoryStorage() });
  store.setDeviceId('kiosk-42');
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.deviceId, 'kiosk-42');
  assert.equal(brand.theme.primary, '#006B3F');
  assert.equal(brand.layout, 'portrait-menu');
});

test('production build disables debug; non-production enables T/Demo', function () {
  const QMS = loadCore();
  assert.equal(QMS.isProductionBuild({ production: true }), true);
  assert.equal(QMS.isDebugEnabled({ production: true }), false);
  assert.equal(QMS.isDebugEnabled({ production: false }), true);
  assert.equal(QMS.isProductionBuild({}), true);
});

test('layout switch is exhaustive for the two mother layouts', function () {
  const QMS = loadCore();
  assert.equal(QMS.resolveLayout('portrait-menu'), 'portrait-menu');
  assert.equal(QMS.resolveLayout('landscape-queue'), 'landscape-queue');
  assert.throws(function () {
    QMS.resolveLayout('unknown');
  }, /未知版型/);
});

test('TTS spoken text splits digits', function () {
  const QMS = loadCore();
  assert.equal(QMS.formatSpokenText('A01'), 'A 0 1');
});

test('preview query overrides layout and history orientation', function () {
  const QMS = loadCore();
  const validated = QMS.validateBrand(sampleBrand, 'guiji');
  const normalized = QMS.normalizeBrand(validated, 'brands/guiji');
  QMS.applyPreviewOverrides(normalized, {
    search: '?layout=landscape-queue&history=vertical',
  });
  assert.equal(normalized.layout, 'landscape-queue');
  assert.equal(normalized.queue.historyOrientation, 'vertical');
});
