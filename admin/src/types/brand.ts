export type BrandLayout = 'portrait-menu' | 'landscape-queue';

export type BrandStatus = 'draft' | 'published';

export type HistoryDisplayMode = 'static' | 'carousel';

export interface BrandDisplaySettings {
  layout: BrandLayout;
  historyMax: number;
  mainNumberSize: number;
  historyDisplayMode: HistoryDisplayMode;
  showLogo: boolean;
  showMenuArea: boolean;
  showMainNumber: boolean;
  showHistory: boolean;
}

export interface BrandImagePosition {
  x: number;
  y: number;
}

export interface BrandImages {
  logoPreviewUrl: string | null;
  menuPreviewUrl: string | null;
  logoPosition: BrandImagePosition;
  menuPosition: BrandImagePosition;
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
