export type BrandLayout = 'portrait-menu' | 'landscape-queue';

export type BrandStatus = 'draft' | 'published';

export interface BrandDisplaySettings {
  layout: BrandLayout;
  historyMax: number;
  showLogo: boolean;
  showMenuArea: boolean;
  showMainNumber: boolean;
  showHistory: boolean;
}

export interface BrandImages {
  logoPreviewUrl: string | null;
  menuPreviewUrl: string | null;
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
