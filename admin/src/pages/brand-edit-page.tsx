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
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Slider,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BoardPreviewEditor } from '../components/board-preview-editor';
import { DraftBanner } from '../components/draft-banner';
import { useBrands } from '../context/brand-context';
import { confirmLeave, useUnsavedBlocker } from '../hooks/use-unsaved-blocker';
import type {
  BrandDisplaySettings,
  BrandFormSnapshot,
  BrandImages,
  BrandLayout,
  BrandRecord,
} from '../types/brand';
import {
  buildFormSnapshot,
  snapshotFromForms,
  snapshotsEqual,
} from '../utils/brand-form';
import type { BlockLayout } from '../utils/block-safety';
import {
  getDefaultHistoryBlockRegion,
  getDefaultLogoBlockRegion,
  getDefaultMainBlockRegion,
  getDefaultMenuBlockRegion,
} from '../utils/default-block-regions';

interface BasicFormValues {
  brandId: string;
  displayName: string;
}

interface DisplayFormValues {
  layout: BrandLayout;
  historyPageIntervalSec: number;
  mainNumberSize: number;
}

export function BrandEditPage() {
  const { id } = useParams<{ id: string }>();
  const { getBrand } = useBrands();
  const brand = id ? getBrand(id) : undefined;

  if (!id || !brand) {
    return <Navigate to="/brands" replace />;
  }

  return <BrandEditPageContent key={id} brandId={id} initialBrand={brand} />;
}

interface BrandEditPageContentProps {
  brandId: string;
  initialBrand: BrandRecord;
}

function BrandEditPageContent({ brandId, initialBrand }: BrandEditPageContentProps) {
  const navigate = useNavigate();
  const { getBrand, updateBrand } = useBrands();
  const brand = getBrand(brandId) ?? initialBrand;

  const [basicForm] = Form.useForm<BasicFormValues>();
  const [displayForm] = Form.useForm<DisplayFormValues>();
  const [previewSettings, setPreviewSettings] = useState<BrandDisplaySettings>(() => ({
    ...initialBrand.displaySettings,
    logoBlockRegion: { ...initialBrand.displaySettings.logoBlockRegion },
    mainBlockRegion: { ...initialBrand.displaySettings.mainBlockRegion },
    historyBlockRegion: { ...initialBrand.displaySettings.historyBlockRegion },
    menuBlockRegion: { ...initialBrand.displaySettings.menuBlockRegion },
  }));
  const [displayName, setDisplayName] = useState(initialBrand.displayName);
  const [imageState, setImageState] = useState<BrandImages>(() => ({ ...initialBrand.images }));
  const [savedSnapshot, setSavedSnapshot] = useState<BrandFormSnapshot>(() =>
    buildFormSnapshot(initialBrand),
  );
  const [currentSnapshot, setCurrentSnapshot] = useState<BrandFormSnapshot>(() =>
    buildFormSnapshot(initialBrand),
  );
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const publishFailOnceRef = useRef(true);

  const isDirty = useMemo(() => {
    return !snapshotsEqual(currentSnapshot, savedSnapshot);
  }, [savedSnapshot, currentSnapshot]);

  useUnsavedBlocker(isDirty);

  useEffect(() => {
    basicForm.setFieldsValue({
      brandId: initialBrand.brandId,
      displayName: initialBrand.displayName,
    });
    displayForm.setFieldsValue({
      layout: initialBrand.displaySettings.layout,
      historyPageIntervalSec: initialBrand.displaySettings.historyPageIntervalSec,
      mainNumberSize: initialBrand.displaySettings.mainNumberSize,
    });
  }, [basicForm, displayForm, initialBrand]);

  const isDraft = brand.status === 'draft';

  const syncSnapshot = (
    basic = basicForm.getFieldsValue(),
    display = displayForm.getFieldsValue(),
    images = imageState,
    settings = previewSettings,
  ) => {
    setCurrentSnapshot(
      snapshotFromForms(basic, { ...settings, ...display }, images),
    );
  };

  const syncPreviewFromForms = () => {
    const basic = basicForm.getFieldsValue();
    const display = displayForm.getFieldsValue();
    const layoutChanged = display.layout !== previewSettings.layout;

    const nextSettings: BrandDisplaySettings = {
      ...previewSettings,
      layout: display.layout,
      historyPageIntervalSec: display.historyPageIntervalSec,
      mainNumberSize: display.mainNumberSize,
      ...(layoutChanged
        ? {
            logoBlockRegion: getDefaultLogoBlockRegion(display.layout),
            mainBlockRegion: getDefaultMainBlockRegion(display.layout),
            historyBlockRegion: getDefaultHistoryBlockRegion(display.layout),
            menuBlockRegion: getDefaultMenuBlockRegion(display.layout),
          }
        : {}),
    };

    setDisplayName(basic.displayName ?? brand.displayName);
    setPreviewSettings(nextSettings);
    syncSnapshot(basic, display, imageState, nextSettings);
  };

  const syncSnapshotWithImages = (nextImages: BrandImages) => {
    syncSnapshot(undefined, undefined, nextImages, undefined);
  };

  const collectPatch = (): Partial<BrandRecord> => {
    const basic = basicForm.getFieldsValue();
    const display = displayForm.getFieldsValue();
    return {
      brandId: basic.brandId,
      displayName: basic.displayName,
      layout: previewSettings.layout,
      displaySettings: { ...previewSettings, ...display },
      images: { ...imageState },
    };
  };

  const handleSaveDraft = () => {
    try {
      const patch = collectPatch();
      updateBrand(brandId, patch);
      const updated = getBrand(brandId);
      if (updated) {
        const snapshot = buildFormSnapshot(updated);
        setSavedSnapshot(snapshot);
        setCurrentSnapshot(snapshot);
      }
      message.success('草稿已儲存');
    } catch {
      message.error('草稿儲存失敗，請稍後再試');
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const patch = collectPatch();
      updateBrand(brandId, patch);

      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });

      if (publishFailOnceRef.current) {
        publishFailOnceRef.current = false;
        setPublishError('發布失敗，看板尚未上線。您的草稿已保留，請稍後再試。');
        message.error('發布失敗');
        return;
      }

      updateBrand(brandId, { status: 'published' });
      const updated = getBrand(brandId);
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

  const handleImageUpload = (kind: 'logo' | 'menu' | 'background', file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        message.error('圖片讀取失敗');
        return;
      }

      setImageState((prev) => {
        const next: BrandImages = {
          ...prev,
          ...(kind === 'logo'
            ? { logoPreviewUrl: reader.result as string }
            : kind === 'menu'
              ? { menuPreviewUrl: reader.result as string }
              : { backgroundPreviewUrl: reader.result as string }),
        };
        syncSnapshotWithImages(next);
        return next;
      });
      message.success('圖片已加入預覽');
    };
    reader.onerror = () => {
      message.error('圖片讀取失敗，請稍後再試');
    };
    reader.readAsDataURL(file);
  };

  const handleBlocksChange = (blocks: BlockLayout) => {
    const nextSettings: BrandDisplaySettings = {
      ...previewSettings,
      logoBlockRegion: blocks.logo,
      mainBlockRegion: blocks.main,
      historyBlockRegion: blocks.history,
      menuBlockRegion: blocks.menu,
    };
    setPreviewSettings(nextSettings);
    syncSnapshot(undefined, undefined, undefined, nextSettings);
  };

  const handleBack = () => {
    confirmLeave(() => navigate('/brands'), isDirty);
  };

  const renderUpload = (
    kind: 'logo' | 'menu' | 'background',
    label: string,
    url: string | null,
  ) => (
    <div>
      <Typography.Text strong>{label}</Typography.Text>
      <div style={{ marginTop: 8 }}>
        <Upload
          listType="picture-card"
          showUploadList={false}
          beforeUpload={(file) => {
            handleImageUpload(kind, file);
            return false;
          }}
        >
          {url ? (
            <img
              src={url}
              alt={`${label} preview`}
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
    </div>
  );

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
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10} xl={9}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  基本資料
                </Typography.Title>
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
              </div>

              <div>
                <Typography.Title level={5}>圖片</Typography.Title>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {renderUpload('logo', 'Logo', imageState.logoPreviewUrl)}
                  {renderUpload('menu', '菜單 / 廣告', imageState.menuPreviewUrl)}
                  {renderUpload('background', '底圖', imageState.backgroundPreviewUrl)}
                </Space>
              </div>

              <div>
                <Typography.Title level={5}>顯示設定</Typography.Title>
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
                    label="歷史翻頁間隔（秒）"
                    name="historyPageIntervalSec"
                    rules={[{ type: 'number', min: 3, max: 30 }]}
                  >
                    <InputNumber min={3} max={30} step={1} style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item label="主叫號字級" name="mainNumberSize">
                    <Slider min={48} max={96} marks={{ 48: '小', 72: '中', 96: '大' }} />
                  </Form.Item>
                </Form>
              </div>

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
          </Col>

          <Col xs={24} lg={14} xl={15}>
            <div className="brand-edit-preview-panel">
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                看板預覽
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                拖曳 Logo、主叫號、歷史、菜單四區塊自由調整位置與大小；選取區塊後可在預覽下方輸入 X/Y/寬/高；預設關閉「吸附：開／關」，需要時再開啟弱對齊。
              </Typography.Paragraph>
              <BoardPreviewEditor
                displayName={displayName}
                settings={previewSettings}
                images={imageState}
                onBlocksChange={handleBlocksChange}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
