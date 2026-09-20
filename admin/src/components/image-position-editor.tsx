import { Slider, Typography } from 'antd';
import type { BrandImagePosition } from '../types/brand';

const SAFETY_RULES = [
  '不要裁切 Logo 或菜單的關鍵內容',
  '圖片需完整留在安全框線內',
  '不可遮蓋主叫號數字區域',
  '不可遮蓋歷史叫號 / 輪播區域',
] as const;

interface ImagePositionEditorProps {
  label: string;
  previewUrl: string | null;
  position: BrandImagePosition;
  onChange: (position: BrandImagePosition) => void;
}

export function ImagePositionEditor({
  label,
  previewUrl,
  position,
  onChange,
}: ImagePositionEditorProps) {
  return (
    <div style={{ width: '100%' }}>
      <Typography.Text strong>{label} · 位置微調</Typography.Text>
      <div
        style={{
          marginTop: 12,
          position: 'relative',
          border: '2px dashed #faad14',
          borderRadius: 8,
          background: '#fafafa',
          height: 200,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '12%',
            border: '1px dashed #006B3F',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '8%',
            right: '8%',
            height: '28%',
            border: '1px dashed #ff4d4f',
            borderRadius: 4,
            pointerEvents: 'none',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '8%',
            right: '8%',
            height: '12%',
            border: '1px dashed #ff4d4f',
            borderRadius: 4,
            pointerEvents: 'none',
            opacity: 0.6,
          }}
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt={`${label} position preview`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${position.x}px)`,
              top: `calc(30% + ${position.y}px)`,
              transform: 'translate(-50%, -50%)',
              maxWidth: 100,
              maxHeight: 60,
              objectFit: 'contain',
            }}
          />
        )}
        {!previewUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 12,
            }}
          >
            上傳圖片後可微調位置
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            水平位移
          </Typography.Text>
          <Slider
            min={-40}
            max={40}
            value={position.x}
            onChange={(x) => onChange({ ...position, x })}
            disabled={!previewUrl}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            垂直位移
          </Typography.Text>
          <Slider
            min={-40}
            max={40}
            value={position.y}
            onChange={(y) => onChange({ ...position, y })}
            disabled={!previewUrl}
          />
        </div>
      </div>
      <Typography.Paragraph
        type="secondary"
        style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}
      >
        安全框線說明（綠框 = 安全區，紅框 = 主叫號 / 歷史區，請勿遮蓋）：
      </Typography.Paragraph>
      <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 12, color: '#666' }}>
        {SAFETY_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
