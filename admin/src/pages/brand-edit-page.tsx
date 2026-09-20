import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Switch,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BoardPreviewMock } from '../components/board-preview-mock';
import { useBrands } from '../context/brand-context';
import type { BrandDisplaySettings, BrandLayout, BrandRecord } from '../types/brand';

interface BasicFormValues {
  brandId: string;
  displayName: string;
}

interface DisplayFormValues {
  layout: BrandLayout;
  historyMax: number;
  showLogo: boolean;
  showMenuArea: boolean;
  showMainNumber: boolean;
  showHistory: boolean;
}

export function BrandEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBrand, updateBrand } = useBrands();
  const brand = id ? getBrand(id) : undefined;

  const [basicForm] = Form.useForm<BasicFormValues>();
  const [displayForm] = Form.useForm<DisplayFormValues>();
  const [previewSettings, setPreviewSettings] = useState<BrandDisplaySettings | null>(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!brand) {
      return;
    }
    basicForm.setFieldsValue({
      brandId: brand.brandId,
      displayName: brand.displayName,
    });
    displayForm.setFieldsValue({ ...brand.displaySettings });
    setPreviewSettings({ ...brand.displaySettings });
    setDisplayName(brand.displayName);
  }, [brand, basicForm, displayForm]);

  if (!id || !brand) {
    return <Navigate to="/brands" replace />;
  }

  const syncPreviewFromForms = () => {
    const basic = basicForm.getFieldsValue();
    const display = displayForm.getFieldsValue();
    setDisplayName(basic.displayName);
    setPreviewSettings({
      layout: display.layout,
      historyMax: display.historyMax,
      showLogo: display.showLogo,
      showMenuArea: display.showMenuArea,
      showMainNumber: display.showMainNumber,
      showHistory: display.showHistory,
    });
  };

  const handleSave = () => {
    try {
      const basic = basicForm.getFieldsValue();
      const display = displayForm.getFieldsValue();
      const patch: Partial<BrandRecord> = {
        brandId: basic.brandId,
        displayName: basic.displayName,
        layout: display.layout,
        displaySettings: { ...display },
      };
      updateBrand(id, patch);
      message.success('已儲存（僅前端假動作）');
      syncPreviewFromForms();
    } catch {
      message.error('儲存失敗');
    }
  };

  const handlePublish = () => {
    try {
      handleSave();
      updateBrand(id, { status: 'published' });
      message.success('已發布（僅前端假動作）');
    } catch {
      message.error('發布失敗');
    }
  };

  const handleFakeUpload = (kind: 'logo' | 'menu') => {
    const placeholder =
      kind === 'logo'
        ? 'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect fill="#006B3F" width="120" height="40" rx="4"/><text x="60" y="25" fill="#DBEE0F" text-anchor="middle" font-size="12">LOGO</text></svg>',
          )
        : 'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="#333" width="200" height="120"/><text x="100" y="65" fill="#888" text-anchor="middle" font-size="12">Menu</text></svg>',
          );

    updateBrand(id, {
      images: {
        ...brand.images,
        ...(kind === 'logo'
          ? { logoPreviewUrl: placeholder }
          : { menuPreviewUrl: placeholder }),
      },
    });
    message.success('已上傳預覽圖（假動作）');
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本資料',
      children: (
        <Form<BasicFormValues> form={basicForm} layout="vertical" onValuesChange={syncPreviewFromForms}>
          <Form.Item
            label="品牌代碼"
            name="brandId"
            rules={[{ required: true, message: '請輸入品牌代碼' }]}
          >
            <Input placeholder="guiji" />
          </Form.Item>
          <Form.Item
            label="顯示名稱"
            name="displayName"
            rules={[{ required: true, message: '請輸入顯示名稱' }]}
          >
            <Input placeholder="龜記" />
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'display',
      label: '顯示設定',
      children: (
        <Form<DisplayFormValues>
          form={displayForm}
          layout="vertical"
          onValuesChange={syncPreviewFromForms}
        >
          <Form.Item label="版面方向" name="layout">
            <Radio.Group>
              <Radio.Button value="portrait-menu">直式 (1080×1920)</Radio.Button>
              <Radio.Button value="landscape-queue">橫式 (1920×1080)</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="歷史叫號筆數"
            name="historyMax"
            rules={[{ type: 'number', min: 1, max: 5 }]}
          >
            <InputNumber min={1} max={5} style={{ width: 120 }} />
          </Form.Item>
          <Divider plain>區塊顯示</Divider>
          <Form.Item label="Logo" name="showLogo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="菜單 / 廣告區" name="showMenuArea" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="主叫號" name="showMainNumber" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="歷史叫號" name="showHistory" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            動效版本已鎖定 guiji，此預覽不提供動畫選擇器。
          </Typography.Text>
        </Form>
      ),
    },
    {
      key: 'images',
      label: '圖片',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>Logo</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={() => {
                  handleFakeUpload('logo');
                  return false;
                }}
              >
                {brand.images.logoPreviewUrl ? (
                  <img
                    src={brand.images.logoPreviewUrl}
                    alt="Logo preview"
                    style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }}
                  />
                ) : (
                  <div>
                    <CloudUploadOutlined />
                    <div style={{ marginTop: 8 }}>假上傳</div>
                  </div>
                )}
              </Upload>
            </div>
          </div>
          <div>
            <Typography.Text strong>菜單 / 廣告圖</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={() => {
                  handleFakeUpload('menu');
                  return false;
                }}
              >
                {brand.images.menuPreviewUrl ? (
                  <img
                    src={brand.images.menuPreviewUrl}
                    alt="Menu preview"
                    style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }}
                  />
                ) : (
                  <div>
                    <CloudUploadOutlined />
                    <div style={{ marginTop: 8 }}>假上傳</div>
                  </div>
                )}
              </Upload>
            </div>
          </div>
        </Space>
      ),
    },
    {
      key: 'preview',
      label: '預覽與發布',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {previewSettings && (
            <BoardPreviewMock displayName={displayName} settings={previewSettings} />
          )}
          <Space>
            <Button type="default" icon={<SaveOutlined />} onClick={handleSave}>
              儲存
            </Button>
            <Button type="primary" icon={<SendOutlined />} onClick={handlePublish}>
              發布
            </Button>
          </Space>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            儲存 / 發布僅更新前端假資料，不會連線至任何後端。
          </Typography.Text>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/brands')}
        style={{ marginBottom: 16 }}
      >
        返回品牌列表
      </Button>
      <Card title={`品牌編輯 · ${brand.displayName}`}>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
