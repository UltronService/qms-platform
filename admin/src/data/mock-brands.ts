import type { BrandRecord } from '../types/brand';
import {
  getDefaultHistoryBlockRegion,
  getDefaultLogoBlockRegion,
  getDefaultMainBlockRegion,
  getDefaultMenuBlockRegion,
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
      historyPageIntervalSec: 6,
      mainNumberSize: 72,
      logoBlockRegion: getDefaultLogoBlockRegion('portrait-menu'),
      mainBlockRegion: getDefaultMainBlockRegion('portrait-menu'),
      historyBlockRegion: getDefaultHistoryBlockRegion('portrait-menu'),
      menuBlockRegion: getDefaultMenuBlockRegion('portrait-menu'),
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
      historyPageIntervalSec: 8,
      mainNumberSize: 64,
      logoBlockRegion: getDefaultLogoBlockRegion('landscape-queue'),
      mainBlockRegion: getDefaultMainBlockRegion('landscape-queue'),
      historyBlockRegion: getDefaultHistoryBlockRegion('landscape-queue'),
      menuBlockRegion: getDefaultMenuBlockRegion('landscape-queue'),
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
      historyPageIntervalSec: 6,
      mainNumberSize: 80,
      logoBlockRegion: getDefaultLogoBlockRegion('portrait-menu'),
      mainBlockRegion: getDefaultMainBlockRegion('portrait-menu'),
      historyBlockRegion: getDefaultHistoryBlockRegion('portrait-menu'),
      menuBlockRegion: getDefaultMenuBlockRegion('portrait-menu'),
    },
    images: {
      logoPreviewUrl: null,
      menuPreviewUrl: null,
      backgroundPreviewUrl: null,
    },
  },
];
