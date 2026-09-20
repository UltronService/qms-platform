import type { BrandRecord } from '../types/brand';

export const mockBrands: BrandRecord[] = [
  {
    id: '1',
    brandId: 'guiji',
    displayName: '龜記',
    layout: 'portrait-menu',
    status: 'published',
    updatedAt: '2026-09-18',
    displaySettings: {
      layout: 'portrait-menu',
      historyMax: 2,
      showLogo: true,
      showMenuArea: true,
      showMainNumber: true,
      showHistory: true,
    },
    images: {
      logoPreviewUrl: '/qms-platform/brands/guiji/assets/logo.svg',
      menuPreviewUrl: null,
    },
  },
  {
    id: '2',
    brandId: 'demo-tea',
    displayName: 'Demo 茶飲',
    layout: 'landscape-queue',
    status: 'draft',
    updatedAt: '2026-09-15',
    displaySettings: {
      layout: 'landscape-queue',
      historyMax: 2,
      showLogo: true,
      showMenuArea: false,
      showMainNumber: true,
      showHistory: true,
    },
    images: {
      logoPreviewUrl: null,
      menuPreviewUrl: null,
    },
  },
  {
    id: '3',
    brandId: 'demo-burger',
    displayName: 'Demo 漢堡',
    layout: 'portrait-menu',
    status: 'published',
    updatedAt: '2026-09-10',
    displaySettings: {
      layout: 'portrait-menu',
      historyMax: 2,
      showLogo: true,
      showMenuArea: true,
      showMainNumber: true,
      showHistory: false,
    },
    images: {
      logoPreviewUrl: null,
      menuPreviewUrl: null,
    },
  },
];
