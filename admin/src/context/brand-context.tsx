import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockBrands } from '../data/mock-brands';
import type { BrandRecord } from '../types/brand';
import {
  getDefaultHistoryBlockRegion,
  getDefaultMainBlockRegion,
} from '../utils/default-block-regions';

interface BrandContextValue {
  brands: BrandRecord[];
  getBrand: (id: string) => BrandRecord | undefined;
  updateBrand: (id: string, patch: Partial<BrandRecord>) => void;
  addBrand: () => BrandRecord;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<BrandRecord[]>(() =>
    structuredClone(mockBrands),
  );

  const getBrand = useCallback(
    (id: string) => brands.find((b) => b.id === id),
    [brands],
  );

  const updateBrand = useCallback((id: string, patch: Partial<BrandRecord>) => {
    setBrands((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              ...patch,
              displaySettings: patch.displaySettings
                ? {
                    ...b.displaySettings,
                    ...patch.displaySettings,
                    mainBlockRegion: patch.displaySettings.mainBlockRegion
                      ? {
                          ...b.displaySettings.mainBlockRegion,
                          ...patch.displaySettings.mainBlockRegion,
                        }
                      : b.displaySettings.mainBlockRegion,
                    historyBlockRegion: patch.displaySettings.historyBlockRegion
                      ? {
                          ...b.displaySettings.historyBlockRegion,
                          ...patch.displaySettings.historyBlockRegion,
                        }
                      : b.displaySettings.historyBlockRegion,
                  }
                : b.displaySettings,
              images: patch.images
                ? { ...b.images, ...patch.images }
                : b.images,
              updatedAt: new Date().toISOString(),
            }
          : b,
      ),
    );
  }, []);

  const addBrand = useCallback(() => {
    const layout = 'portrait-menu' as const;
    const next: BrandRecord = {
      id: String(Date.now()),
      brandId: `brand-${Date.now()}`,
      displayName: '新品牌',
      layout,
      status: 'draft',
      updatedAt: new Date().toISOString().slice(0, 10),
      displaySettings: {
        layout,
        historyMax: 2,
        mainNumberSize: 72,
        historyDisplayMode: 'static',
        mainBlockRegion: getDefaultMainBlockRegion(layout),
        historyBlockRegion: getDefaultHistoryBlockRegion(layout),
      },
      images: {
        logoPreviewUrl: null,
        menuPreviewUrl: null,
        backgroundPreviewUrl: null,
      },
    };
    setBrands((prev) => [next, ...prev]);
    return next;
  }, []);

  const value = useMemo(
    () => ({ brands, getBrand, updateBrand, addBrand }),
    [brands, getBrand, updateBrand, addBrand],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrands(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error('useBrands must be used within BrandProvider');
  }
  return ctx;
}
