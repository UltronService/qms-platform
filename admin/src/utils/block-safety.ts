import type { BlockRegion } from '../types/brand';
import { getLayoutZones, type LayoutZones } from './default-block-regions';

export const SAFETY_MESSAGES = {
  cropImage: '不可裁切 Logo 或菜單的關鍵內容',
  leaveSafeFrame: '區塊需完整留在安全框線內',
  coverMain: '不可遮蓋主叫號數字區域',
  coverHistory: '不可遮蓋歷史叫號區域',
} as const;

export type SafetyViolation = keyof typeof SAFETY_MESSAGES;

export interface SafetyResult {
  valid: boolean;
  violation: SafetyViolation | null;
  message: string | null;
}

function rectsOverlap(a: BlockRegion, b: BlockRegion): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function isInsideSafeFrame(region: BlockRegion, safeFrame: BlockRegion): boolean {
  return (
    region.x >= safeFrame.x &&
    region.y >= safeFrame.y &&
    region.x + region.width <= safeFrame.x + safeFrame.width &&
    region.y + region.height <= safeFrame.y + safeFrame.height
  );
}

function overlapsImageContent(
  region: BlockRegion,
  logo: BlockRegion,
  menu: BlockRegion,
  hasLogo: boolean,
  hasMenu: boolean,
): boolean {
  if (hasLogo && rectsOverlap(region, logo)) {
    return true;
  }
  if (hasMenu && rectsOverlap(region, menu)) {
    return true;
  }
  return false;
}

export function validateBlockLayout(
  mainBlock: BlockRegion,
  historyBlock: BlockRegion,
  layout: 'portrait-menu' | 'landscape-queue',
  hasLogo: boolean,
  hasMenu: boolean,
  movedBlock?: 'main' | 'history',
): SafetyResult {
  const zones = getLayoutZones(layout);

  for (const region of [mainBlock, historyBlock]) {
    if (!isInsideSafeFrame(region, zones.safeFrame)) {
      return { valid: false, violation: 'leaveSafeFrame', message: SAFETY_MESSAGES.leaveSafeFrame };
    }
  }

  if (overlapsImageContent(mainBlock, zones.logo, zones.menu, hasLogo, hasMenu)) {
    return { valid: false, violation: 'cropImage', message: SAFETY_MESSAGES.cropImage };
  }

  if (overlapsImageContent(historyBlock, zones.logo, zones.menu, hasLogo, hasMenu)) {
    return { valid: false, violation: 'cropImage', message: SAFETY_MESSAGES.cropImage };
  }

  if (rectsOverlap(mainBlock, historyBlock)) {
    if (movedBlock === 'history') {
      return { valid: false, violation: 'coverMain', message: SAFETY_MESSAGES.coverMain };
    }
    return { valid: false, violation: 'coverHistory', message: SAFETY_MESSAGES.coverHistory };
  }

  return { valid: true, violation: null, message: null };
}

export interface SnapGuide {
  orientation: 'horizontal' | 'vertical';
  positionPx: number;
}

export function clampRegion(region: BlockRegion): BlockRegion {
  const minSize = 8;
  let { x, y, width, height } = region;
  width = Math.max(minSize, Math.min(100 - x, width));
  height = Math.max(minSize, Math.min(100 - y, height));
  x = Math.max(0, Math.min(100 - width, x));
  y = Math.max(0, Math.min(100 - height, y));
  return { x, y, width, height };
}

export function getZonesForLayout(layout: 'portrait-menu' | 'landscape-queue'): LayoutZones {
  return getLayoutZones(layout);
}
