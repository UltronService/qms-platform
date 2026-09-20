import type { BrandFormSnapshot, BrandRecord } from '../types/brand';

export function buildFormSnapshot(brand: BrandRecord): BrandFormSnapshot {
  return {
    brandId: brand.brandId,
    displayName: brand.displayName,
    displaySettings: { ...brand.displaySettings },
    images: {
      logoPreviewUrl: brand.images.logoPreviewUrl,
      menuPreviewUrl: brand.images.menuPreviewUrl,
      logoPosition: { ...brand.images.logoPosition },
      menuPosition: { ...brand.images.menuPosition },
    },
  };
}

export function snapshotFromForms(
  basic: { brandId: string; displayName: string },
  display: BrandRecord['displaySettings'],
  images: BrandRecord['images'],
): BrandFormSnapshot {
  return {
    brandId: basic.brandId,
    displayName: basic.displayName,
    displaySettings: { ...display },
    images: {
      logoPreviewUrl: images.logoPreviewUrl,
      menuPreviewUrl: images.menuPreviewUrl,
      logoPosition: { ...images.logoPosition },
      menuPosition: { ...images.menuPosition },
    },
  };
}

export function snapshotsEqual(a: BrandFormSnapshot, b: BrandFormSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
