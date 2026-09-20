import { Badge, Space, Tag } from 'antd';
import type { BrandStatus } from '../types/brand';

interface BrandStatusTagProps {
  status: BrandStatus;
}

export function BrandStatusTag({ status }: BrandStatusTagProps) {
  if (status === 'published') {
    return (
      <Space size={6}>
        <Badge status="success" />
        <Tag color="success" style={{ fontWeight: 600, margin: 0 }}>
          已發布
        </Tag>
      </Space>
    );
  }

  return (
    <Space size={6}>
      <Badge status="warning" />
      <Tag color="warning" style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>
        未發布 · 草稿
      </Tag>
    </Space>
  );
}
