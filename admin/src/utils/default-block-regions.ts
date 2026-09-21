import type { BlockRegion, BrandLayout } from '../types/brand';

export interface LayoutZones {
  logo: BlockRegion;
  menu: BlockRegion;
}

export function getDefaultMainBlockRegion(layout: BrandLayout): BlockRegion {
  if (layout === 'portrait-menu') {
    return { x: 10, y: 18, width: 80, height: 22 };
  }
  return { x: 52, y: 12, width: 42, height: 48 };
}

export function getDefaultHistoryBlockRegion(layout: BrandLayout): BlockRegion {
  if (layout === 'portrait-menu') {
    return { x: 10, y: 38, width: 80, height: 10 };
  }
  return { x: 52, y: 64, width: 42, height: 14 };
}

export function getDefaultLogoBlockRegion(layout: BrandLayout): BlockRegion {
  return { ...getLayoutZones(layout).logo };
}

export function getDefaultMenuBlockRegion(layout: BrandLayout): BlockRegion {
  return { ...getLayoutZones(layout).menu };
}

export function getLayoutZones(layout: BrandLayout): LayoutZones {
  if (layout === 'portrait-menu') {
    return {
      logo: { x: 5, y: 5, width: 90, height: 12 },
      menu: { x: 5, y: 50, width: 90, height: 45 },
    };
  }

  return {
    logo: { x: 52, y: 5, width: 42, height: 10 },
    menu: { x: 5, y: 5, width: 42, height: 90 },
  };
}
