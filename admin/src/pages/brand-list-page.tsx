import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useBrands } from '../context/brand-context';
import type { BrandRecord } from '../types/brand';

const layoutLabel: Record<BrandRecord['layout'], string> = {
  'portrait-menu': '直式',
  'landscape-queue': '橫式',
};

export function BrandListPage() {
  const navigate = useNavigate();
  const { brands, addBrand } = useBrands();

  const handleAdd = () => {
    const created = addBrand();
    message.success('已新增假資料品牌（僅前端）');
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
      title: '更新日期',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BrandRecord['status']) =>
        status === 'published' ? (
          <Tag color="success">已發布</Tag>
        ) : (
          <Tag color="default">草稿</Tag>
        ),
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
      />
    </Card>
  );
}
