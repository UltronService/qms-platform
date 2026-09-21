export type BrandLayout = 'portrait-menu' | 'landscape-queue';

export type BrandStatus = 'draft' | 'published';

export type HistoryDisplayMode = 'static' | 'carousel';

/** Percentage-based region on the call-board canvas (0–100). */
export interface BlockRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrandDisplaySettings {
  layout: BrandLayout;
  historyMax: number;
  mainNumberSize: number;
  historyDisplayMode: HistoryDisplayMode;
  logoBlockRegion: BlockRegion;
  mainBlockRegion: BlockRegion;
  historyBlockRegion: BlockRegion;
  menuBlockRegion: BlockRegion;
}

export interface BrandImages {
  logoPreviewUrl: string | null;
  menuPreviewUrl: string | null;
  backgroundPreviewUrl: string | null;
}

export interface BrandRecord {
  id: string;
  brandId: string;
  displayName: string;
  layout: BrandLayout;
  status: BrandStatus;
  updatedAt: string;
  displaySettings: BrandDisplaySettings;
  images: BrandImages;
}

export interface BrandFormSnapshot {
  brandId: string;
  displayName: string;
  displaySettings: BrandDisplaySettings;
  images: BrandImages;
}
