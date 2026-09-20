import { SyncOutlined } from '@ant-design/icons';
import { Space, Typography } from 'antd';
import type { BrandDisplaySettings } from '../types/brand';

interface BoardPreviewMockProps {
  displayName: string;
  settings: BrandDisplaySettings;
}

export function BoardPreviewMock({ displayName, settings }: BoardPreviewMockProps) {
  const isPortrait = settings.layout === 'portrait-menu';
  const isCarousel = settings.historyDisplayMode === 'carousel';

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#1a1a1a',
        maxWidth: isPortrait ? 280 : 420,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          aspectRatio: isPortrait ? '9 / 16' : '16 / 9',
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
          padding: 12,
          gap: 8,
        }}
      >
        {settings.showLogo && (
          <div
            style={{
              background: '#006B3F',
              color: '#DBEE0F',
              borderRadius: 4,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            LOGO
          </div>
        )}
        {settings.showMenuArea && isPortrait && (
          <div
            style={{
              flex: 1,
              background: '#333',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: 11,
            }}
          >
            菜單區
          </div>
        )}
        <div
          style={{
            flex: isPortrait ? 'none' : 1,
            background: '#006B3F',
            borderRadius: 4,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            minHeight: isPortrait ? 120 : undefined,
          }}
        >
          {settings.showMainNumber && (
            <Typography.Title
              level={1}
              style={{
                color: '#fff',
                margin: 0,
                fontSize: settings.mainNumberSize,
                lineHeight: 1.1,
              }}
            >
              A128
            </Typography.Title>
          )}
          {settings.showHistory && (
            <Space size={6}>
              {isCarousel && (
                <SyncOutlined spin style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: settings.historyMax }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      opacity: isCarousel && i > 0 ? 0.5 : 1,
                    }}
                  >
                    A{120 + i}
                  </span>
                ))}
              </div>
            </Space>
          )}
        </div>
        {!isPortrait && settings.showMenuArea && (
          <div
            style={{
              width: '35%',
              background: '#333',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: 11,
            }}
          >
            廣告區
          </div>
        )}
      </div>
      <div
        style={{
          background: '#fafafa',
          padding: '6px 12px',
          fontSize: 11,
          color: '#666',
          textAlign: 'center',
        }}
      >
        {displayName} · {isPortrait ? '直式' : '橫式'} ·{' '}
        {isCarousel ? '歷史輪播' : '歷史並排'} · 靜態預覽
      </div>
    </div>
  );
}
