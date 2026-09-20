import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandStatusTag } from '../components/brand-status-tag';
import { DraftBanner } from '../components/draft-banner';
import { useBrands } from '../context/brand-context';
import type { BrandRecord } from '../types/brand';
import { formatUpdatedAt } from '../utils/brand-form';

const layoutLabel: Record<BrandRecord['layout'], string> = {
  'portrait-menu': '直式',
  'landscape-queue': '橫式',
};

export function BrandListPage() {
  const navigate = useNavigate();
  const { brands, addBrand } = useBrands();

  const draftCount = useMemo(
    () => brands.filter((b) => b.status === 'draft').length,
    [brands],
  );

  const handleAdd = () => {
    const created = addBrand();
    message.info('已建立新品牌草稿');
    navigate(`/brands/${created.id}/edit`);
  };

  const columns: ColumnsType<BrandRecord> = [
    {
      title: '品牌名稱',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.brandId}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '版面',
      dataIndex: 'layout',
      key: 'layout',
      width: 100,
      render: (layout: BrandRecord['layout']) => layoutLabel[layout],
    },
    {
      title: '更新時間',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (value: string) => formatUpdatedAt(value),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: BrandRecord['status']) => <BrandStatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => navigate(`/brands/${record.id}/edit`)}
        >
          進入編輯
        </Button>
      ),
    },
  ];

  return (
    <div>
      {draftCount > 0 && (
        <DraftBanner
          message={`尚有 ${draftCount} 個品牌尚未發布`}
          description="未發布的草稿不會出現在門市看板上。請完成編輯並發布後，門市才會看到最新內容。"
        />
      )}
      <Card
        title="品牌列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
        }
      >
        <Table<BrandRecord>
          rowKey="id"
          columns={columns}
          dataSource={brands}
          pagination={false}
          rowClassName={(record) =>
            record.status === 'draft' ? 'brand-row-draft' : ''
          }
        />
      </Card>
    </div>
  );
}
