import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Slider,
  Space,
  Spin,
  Switch,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BoardPreviewMock } from '../components/board-preview-mock';
import { DraftBanner } from '../components/draft-banner';
import { ImagePositionEditor } from '../components/image-position-editor';
import { useBrands } from '../context/brand-context';
import { confirmLeave, useUnsavedBlocker } from '../hooks/use-unsaved-blocker';
import type {
  BrandDisplaySettings,
  BrandFormSnapshot,
  BrandImages,
  BrandLayout,
  BrandRecord,
  HistoryDisplayMode,
} from '../types/brand';
import {
  buildFormSnapshot,
  snapshotFromForms,
  snapshotsEqual,
} from '../utils/brand-form';

interface BasicFormValues {
  brandId: string;
  displayName: string;
}

interface DisplayFormValues {
  layout: BrandLayout;
  historyMax: number;
  mainNumberSize: number;
  historyDisplayMode: HistoryDisplayMode;
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
  const [imageState, setImageState] = useState<BrandImages | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<BrandFormSnapshot | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<BrandFormSnapshot | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const publishFailOnceRef = useRef(true);

  const isDirty = useMemo(() => {
    if (!savedSnapshot || !currentSnapshot) {
      return false;
    }
    return !snapshotsEqual(currentSnapshot, savedSnapshot);
  }, [savedSnapshot, currentSnapshot]);

  useUnsavedBlocker(isDirty);

  const loadFromBrand = useCallback(
    (source: BrandRecord) => {
      basicForm.setFieldsValue({
        brandId: source.brandId,
        displayName: source.displayName,
      });
      displayForm.setFieldsValue({ ...source.displaySettings });
      setPreviewSettings({ ...source.displaySettings });
      setDisplayName(source.displayName);
      setImageState({ ...source.images });
      const snapshot = buildFormSnapshot(source);
      setSavedSnapshot(snapshot);
      setCurrentSnapshot(snapshot);
      publishFailOnceRef.current = true;
      setPublishError(null);
    },
    [basicForm, displayForm],
  );

  useEffect(() => {
    if (!brand) {
      return;
    }
    loadFromBrand(brand);
  }, [brand, loadFromBrand]);

  if (!id || !brand) {
    return <Navigate to="/brands" replace />;
  }

  if (!imageState) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const isDraft = brand.status === 'draft';

  const syncPreviewFromForms = () => {
    const basic = basicForm.getFieldsValue();
    const display = displayForm.getFieldsValue();
    setDisplayName(basic.displayName ?? brand.displayName);
    setPreviewSettings({
      layout: display.layout,
      historyMax: display.historyMax,
      mainNumberSize: display.mainNumberSize,
      historyDisplayMode: display.historyDisplayMode,
      showLogo: display.showLogo,
      showMenuArea: display.showMenuArea,
      showMainNumber: display.showMainNumber,
      showHistory: display.showHistory,
    });
    if (imageState) {
      setCurrentSnapshot(snapshotFromForms(basic, display, imageState));
    }
  };

  const syncSnapshotWithImages = (nextImages: BrandImages) => {
    const basic = basicForm.getFieldsValue();
    const display = displayForm.getFieldsValue();
    setCurrentSnapshot(snapshotFromForms(basic, display, nextImages));
  };

  const collectPatch = (): Partial<BrandRecord> => {
    const basic = basicForm.getFieldsValue();
    const display = displayForm.getFieldsValue();
    return {
      brandId: basic.brandId,
      displayName: basic.displayName,
      layout: display.layout,
      displaySettings: { ...display },
      images: { ...imageState },
    };
  };

  const handleSaveDraft = () => {
    try {
      const patch = collectPatch();
      updateBrand(id, patch);
      const updated = getBrand(id);
      if (updated) {
        const snapshot = buildFormSnapshot(updated);
        setSavedSnapshot(snapshot);
        setCurrentSnapshot(snapshot);
      }
      message.success('草稿已儲存');
      syncPreviewFromForms();
    } catch {
      message.error('草稿儲存失敗，請稍後再試');
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const patch = collectPatch();
      updateBrand(id, patch);
      syncPreviewFromForms();

      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });

      if (publishFailOnceRef.current) {
        publishFailOnceRef.current = false;
        setPublishError('發布失敗，看板尚未上線。您的草稿已保留，請稍後再試。');
        message.error('發布失敗');
        return;
      }

      updateBrand(id, { status: 'published' });
      const updated = getBrand(id);
      if (updated) {
        const snapshot = buildFormSnapshot(updated);
        setSavedSnapshot(snapshot);
        setCurrentSnapshot(snapshot);
      }
      setPublishError(null);
      message.success('已成功發布至看板');
    } catch {
      setPublishError('發布失敗，看板尚未上線。您的草稿已保留，請稍後再試。');
      message.error('發布失敗');
    } finally {
      setPublishing(false);
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

    setImageState((prev) => {
      if (!prev) {
        return prev;
      }
      const next = {
        ...prev,
        ...(kind === 'logo'
          ? { logoPreviewUrl: placeholder }
          : { menuPreviewUrl: placeholder }),
      };
      syncSnapshotWithImages(next);
      return next;
    });
    message.info('圖片已加入預覽（假上傳）');
  };

  const handleBack = () => {
    confirmLeave(() => navigate('/brands'), isDirty);
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本資料',
      children: (
        <Form<BasicFormValues>
          form={basicForm}
          layout="vertical"
          onValuesChange={syncPreviewFromForms}
        >
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
          <Form.Item label="主叫號字級" name="mainNumberSize">
            <Slider min={48} max={96} marks={{ 48: '小', 72: '中', 96: '大' }} />
          </Form.Item>
          <Form.Item label="歷史叫號顯示方式" name="historyDisplayMode">
            <Radio.Group>
              <Radio.Button value="static">並排顯示</Radio.Button>
              <Radio.Button value="carousel">輪播</Radio.Button>
            </Radio.Group>
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
                {imageState.logoPreviewUrl ? (
                  <img
                    src={imageState.logoPreviewUrl}
                    alt="Logo preview"
                    style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }}
                  />
                ) : (
                  <div>
                    <CloudUploadOutlined />
                    <div style={{ marginTop: 8 }}>選擇圖片</div>
                  </div>
                )}
              </Upload>
            </div>
            <ImagePositionEditor
              label="Logo"
              previewUrl={imageState.logoPreviewUrl}
              position={imageState.logoPosition}
              onChange={(logoPosition) =>
                setImageState((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  const next = { ...prev, logoPosition };
                  syncSnapshotWithImages(next);
                  return next;
                })
              }
            />
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
                {imageState.menuPreviewUrl ? (
                  <img
                    src={imageState.menuPreviewUrl}
                    alt="Menu preview"
                    style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }}
                  />
                ) : (
                  <div>
                    <CloudUploadOutlined />
                    <div style={{ marginTop: 8 }}>選擇圖片</div>
                  </div>
                )}
              </Upload>
            </div>
            <ImagePositionEditor
              label="菜單 / 廣告"
              previewUrl={imageState.menuPreviewUrl}
              position={imageState.menuPosition}
              onChange={(menuPosition) =>
                setImageState((prev) => {
                  if (!prev) {
                    return prev;
                  }
                  const next = { ...prev, menuPosition };
                  syncSnapshotWithImages(next);
                  return next;
                })
              }
            />
          </div>
        </Space>
      ),
    },
    {
      key: 'preview',
      label: '預覽與發布',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            發布前請確認看板預覽是否符合預期。發布後門市看板才會更新。
          </Typography.Text>
          {previewSettings && (
            <BoardPreviewMock displayName={displayName} settings={previewSettings} />
          )}
          {publishError && (
            <Alert
              type="error"
              showIcon
              message="發布失敗"
              description={publishError}
              action={
                <Button
                  size="small"
                  type="primary"
                  danger
                  icon={<ReloadOutlined />}
                  loading={publishing}
                  onClick={handlePublish}
                >
                  重試發布
                </Button>
              }
            />
          )}
          <Space>
            <Button type="default" icon={<SaveOutlined />} onClick={handleSaveDraft}>
              儲存草稿
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={publishing}
              onClick={handlePublish}
            >
              發布
            </Button>
          </Space>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {(isDraft || isDirty) && (
        <DraftBanner
          message={isDraft ? '此品牌尚未發布' : '您有尚未儲存的變更'}
          description={
            isDraft
              ? '門市看板目前不會顯示此品牌的最新內容。完成編輯後請按「發布」才會上線。'
              : '請先「儲存草稿」或「發布」，否則離開此頁將遺失變更。'
          }
        />
      )}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
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
