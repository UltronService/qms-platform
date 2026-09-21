import type { BlockRegion } from '../types/brand';

export type BlockKind = 'logo' | 'main' | 'history' | 'menu';

export interface BlockLayout {
  logo: BlockRegion;
  main: BlockRegion;
  history: BlockRegion;
  menu: BlockRegion;
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

export interface PixelMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function regionToPixelMetrics(
  region: BlockRegion,
  canvasWidth: number,
  canvasHeight: number,
): PixelMetrics {
  return {
    x: Math.round((region.x / 100) * canvasWidth),
    y: Math.round((region.y / 100) * canvasHeight),
    width: Math.round((region.width / 100) * canvasWidth),
    height: Math.round((region.height / 100) * canvasHeight),
  };
}

export function pixelMetricsToRegion(
  metrics: PixelMetrics,
  canvasWidth: number,
  canvasHeight: number,
): BlockRegion {
  return clampRegion({
    x: (metrics.x / canvasWidth) * 100,
    y: (metrics.y / canvasHeight) * 100,
    width: (metrics.width / canvasWidth) * 100,
    height: (metrics.height / canvasHeight) * 100,
  });
}
