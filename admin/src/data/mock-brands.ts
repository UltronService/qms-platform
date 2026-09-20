import type { BrandRecord } from '../types/brand';
import {
  getDefaultHistoryBlockRegion,
  getDefaultMainBlockRegion,
} from '../utils/default-block-regions';

export const mockBrands: BrandRecord[] = [
  {
    id: '1',
    brandId: 'guiji',
    displayName: '龜記',
    layout: 'portrait-menu',
    status: 'published',
    updatedAt: '2026-09-18T14:30:00',
    displaySettings: {
      layout: 'portrait-menu',
      historyMax: 2,
      mainNumberSize: 72,
      historyDisplayMode: 'static',
      mainBlockRegion: getDefaultMainBlockRegion('portrait-menu'),
      historyBlockRegion: getDefaultHistoryBlockRegion('portrait-menu'),
    },
    images: {
      logoPreviewUrl: '/qms-platform/brands/guiji/assets/logo.svg',
      menuPreviewUrl: null,
      backgroundPreviewUrl: null,
    },
  },
  {
    id: '2',
    brandId: 'demo-tea',
    displayName: 'Demo 茶飲',
    layout: 'landscape-queue',
    status: 'draft',
    updatedAt: '2026-09-15T09:15:00',
    displaySettings: {
      layout: 'landscape-queue',
      historyMax: 2,
      mainNumberSize: 64,
      historyDisplayMode: 'carousel',
      mainBlockRegion: getDefaultMainBlockRegion('landscape-queue'),
      historyBlockRegion: getDefaultHistoryBlockRegion('landscape-queue'),
    },
    images: {
      logoPreviewUrl: null,
      menuPreviewUrl: null,
      backgroundPreviewUrl: null,
    },
  },
  {
    id: '3',
    brandId: 'demo-burger',
    displayName: 'Demo 漢堡',
    layout: 'portrait-menu',
    status: 'published',
    updatedAt: '2026-09-10T16:45:00',
    displaySettings: {
      layout: 'portrait-menu',
      historyMax: 2,
      mainNumberSize: 80,
      historyDisplayMode: 'static',
      mainBlockRegion: getDefaultMainBlockRegion('portrait-menu'),
      historyBlockRegion: getDefaultHistoryBlockRegion('portrait-menu'),
    },
    images: {
      logoPreviewUrl: null,
      menuPreviewUrl: null,
      backgroundPreviewUrl: null,
    },
  },
];
