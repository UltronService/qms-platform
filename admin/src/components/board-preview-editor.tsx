import {
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Button, InputNumber, Space, Switch, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { BlockRegion, BrandDisplaySettings, BrandImages, BrandLayout } from '../types/brand';
import {
  clampHistoryPage,
  computeHistoryPagination,
  sliceHistoryPage,
} from '../utils/history-pagination';
import {
  clampRegion,
  pixelMetricsToRegion,
  regionToPixelMetrics,
  type BlockKind,
  type BlockLayout,
  type PixelMetrics,
  type SnapGuide,
} from '../utils/block-safety';
import './board-preview-editor.css';

type ResizeHandle =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw';

const PREVIEW_HISTORY_ITEMS = Array.from({ length: 14 }, (_, index) => `A${127 - index}`);

interface BoardHistoryPreviewProps {
  intervalSec: number;
}

function BoardHistoryPreview({ intervalSec }: BoardHistoryPreviewProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState({
    pageSize: 3,
    pageCount: 1,
    showPager: false,
  });

  const recomputeLayout = useCallback(() => {
    const stack = stackRef.current;
    const items = itemsRef.current;
    const pager = pagerRef.current;
    if (!stack || !items) {
      return;
    }

    const blockHeight = stack.clientHeight;
    const probe = document.createElement('span');
    probe.className = 'board-history-chip';
    probe.textContent = 'A000';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.visibility = 'hidden';
    probe.style.position = 'absolute';
    items.appendChild(probe);
    const styles = window.getComputedStyle(items);
    const gap = Number.parseFloat(styles.gap || styles.rowGap || '0') || 0;
    const rowHeight = probe.getBoundingClientRect().height + gap;
    items.removeChild(probe);

    let pagerHeight = 0;
    if (pager) {
      const wasHidden = pager.hidden;
      pager.hidden = false;
      pagerHeight = pager.getBoundingClientRect().height;
      pager.hidden = wasHidden;
    }

    const nextLayout = computeHistoryPagination(
      PREVIEW_HISTORY_ITEMS.length,
      blockHeight,
      rowHeight,
      pagerHeight,
    );
    setLayout(nextLayout);
    setPage((prev) => clampHistoryPage(prev, nextLayout.pageCount));
  }, []);

  useEffect(() => {
    recomputeLayout();
    const stack = stackRef.current;
    if (!stack || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      recomputeLayout();
    });
    observer.observe(stack);
    return () => {
      observer.disconnect();
    };
  }, [recomputeLayout]);

  const pageItems = useMemo(
    () => sliceHistoryPage(PREVIEW_HISTORY_ITEMS, page, layout.pageSize),
    [layout.pageSize, page],
  );

  const goPage = (next: number) => {
    setPage(clampHistoryPage(next, layout.pageCount));
  };

  return (
    <div className="board-history-content">
      <div className="board-history-stack" ref={stackRef}>
        <div className="board-history-items" ref={itemsRef}>
          {pageItems.map((code) => (
            <span key={code} className="board-history-chip">
              {code}
            </span>
          ))}
        </div>
        <div
          className="board-history-pager"
          ref={pagerRef}
          hidden={!layout.showPager}
        >
          <button
            type="button"
            className="board-history-pager-btn"
            disabled={page <= 1}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => goPage(page - 1)}
          >
            上一頁
          </button>
          <span className="board-history-pager-status">
            {page}／{layout.pageCount}
          </span>
          <button
            type="button"
            className="board-history-pager-btn"
            disabled={page >= layout.pageCount}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => goPage(page + 1)}
          >
            下一頁
          </button>
        </div>
      </div>
      {layout.showPager && (
        <div className="board-history-store-note">
          門市將每 {intervalSec} 秒自動翻
        </div>
      )}
    </div>
  );
}

interface BoardPreviewEditorProps {
  displayName: string;
  settings: BrandDisplaySettings;
  images: BrandImages;
  onBlocksChange: (blocks: BlockLayout) => void;
}

interface DragState {
  kind: BlockKind;
  mode: 'move' | 'resize';
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  origin: BlockRegion;
}

const SNAP_PX = 3;
const MIN_BLOCK_PCT = 8;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

const CANVAS_DIMS: Record<BrandLayout, { width: number; height: number }> = {
  'portrait-menu': { width: 1080, height: 1920 },
  'landscape-queue': { width: 1920, height: 1080 },
};

const BLOCK_LABELS: Record<BlockKind, string> = {
  logo: 'Logo',
  main: '主叫號區',
  history: '歷史區',
  menu: '菜單區',
};

function regionStyle(region: BlockRegion): CSSProperties {
  return {
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

function pctToPx(value: number, total: number): number {
  return (value / 100) * total;
}

function pxToPct(value: number, total: number): number {
  return (value / total) * 100;
}

function regionEdges(region: BlockRegion, canvasW: number, canvasH: number) {
  const left = pctToPx(region.x, canvasW);
  const right = pctToPx(region.x + region.width, canvasW);
  const centerX = pctToPx(region.x + region.width / 2, canvasW);
  const top = pctToPx(region.y, canvasH);
  const bottom = pctToPx(region.y + region.height, canvasH);
  const centerY = pctToPx(region.y + region.height / 2, canvasH);
  return { left, right, centerX, top, bottom, centerY };
}

function collectEdgeTargets(
  regions: BlockRegion[],
  canvasW: number,
  canvasH: number,
): {
  xTargets: number[];
  yTargets: number[];
} {
  const xTargets = [canvasW / 2];
  const yTargets = [canvasH / 2];

  for (const region of regions) {
    const edges = regionEdges(region, canvasW, canvasH);
    xTargets.push(edges.left, edges.centerX, edges.right);
    yTargets.push(edges.top, edges.centerY, edges.bottom);
  }

  return { xTargets, yTargets };
}

function collectSnapGuides(
  region: BlockRegion,
  canvasW: number,
  canvasH: number,
  snapTargets: BlockRegion[],
): { region: BlockRegion; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  let { x, y, width, height } = region;

  const left = pctToPx(x, canvasW);
  const right = pctToPx(x + width, canvasW);
  const centerX = pctToPx(x + width / 2, canvasW);
  const top = pctToPx(y, canvasH);
  const bottom = pctToPx(y + height, canvasH);
  const centerY = pctToPx(y + height / 2, canvasH);

  const xSnaps: Array<{ edge: number; setX: (target: number) => void }> = [
    { edge: left, setX: (t) => { x = pxToPct(t, canvasW); } },
    { edge: centerX, setX: (t) => { x = pxToPct(t, canvasW) - width / 2; } },
    { edge: right, setX: (t) => { x = pxToPct(t, canvasW) - width; } },
  ];

  const ySnaps: Array<{ edge: number; setY: (target: number) => void }> = [
    { edge: top, setY: (t) => { y = pxToPct(t, canvasH); } },
    { edge: centerY, setY: (t) => { y = pxToPct(t, canvasH) - height / 2; } },
    { edge: bottom, setY: (t) => { y = pxToPct(t, canvasH) - height; } },
  ];

  const { xTargets, yTargets } = collectEdgeTargets(snapTargets, canvasW, canvasH);

  for (const snap of xSnaps) {
    let bestDist = SNAP_PX + 1;
    let bestTarget = 0;
    for (const target of xTargets) {
      const dist = Math.abs(snap.edge - target);
      if (dist <= SNAP_PX && dist < bestDist) {
        bestDist = dist;
        bestTarget = target;
      }
    }
    if (bestDist <= SNAP_PX) {
      snap.setX(bestTarget);
      guides.push({ orientation: 'vertical', positionPx: bestTarget });
    }
  }

  for (const snap of ySnaps) {
    let bestDist = SNAP_PX + 1;
    let bestTarget = 0;
    for (const target of yTargets) {
      const dist = Math.abs(snap.edge - target);
      if (dist <= SNAP_PX && dist < bestDist) {
        bestDist = dist;
        bestTarget = target;
      }
    }
    if (bestDist <= SNAP_PX) {
      snap.setY(bestTarget);
      guides.push({ orientation: 'horizontal', positionPx: bestTarget });
    }
  }

  return { region: clampRegion({ x, y, width, height }), guides };
}

function applyResize(
  origin: BlockRegion,
  handle: ResizeHandle,
  dxPct: number,
  dyPct: number,
): BlockRegion {
  let { x, y, width, height } = origin;

  if (handle.includes('e')) {
    width = Math.max(MIN_BLOCK_PCT, width + dxPct);
  }
  if (handle.includes('w')) {
    const newWidth = Math.max(MIN_BLOCK_PCT, width - dxPct);
    x = x + (width - newWidth);
    width = newWidth;
  }
  if (handle.includes('s')) {
    height = Math.max(MIN_BLOCK_PCT, height + dyPct);
  }
  if (handle.includes('n')) {
    const newHeight = Math.max(MIN_BLOCK_PCT, height - dyPct);
    y = y + (height - newHeight);
    height = newHeight;
  }

  return clampRegion({ x, y, width, height });
}

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

interface BlockRegionInputsProps {
  kind: BlockKind;
  region: BlockRegion;
  canvasWidth: number;
  canvasHeight: number;
  onChange: (metrics: PixelMetrics) => void;
}

function BlockRegionInputs({
  kind,
  region,
  canvasWidth,
  canvasHeight,
  onChange,
}: BlockRegionInputsProps) {
  const px = regionToPixelMetrics(region, canvasWidth, canvasHeight);

  const handleFieldChange = (field: keyof PixelMetrics, value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return;
    }
    onChange({ ...px, [field]: value });
  };

  return (
    <div className="board-region-inputs">
      <Typography.Text type="secondary" className="board-region-inputs__label">
        {BLOCK_LABELS[kind]} 位置與尺寸（px）
      </Typography.Text>
      <Space wrap size="small">
        <label className="board-region-inputs__field">
          <span>X</span>
          <InputNumber
            size="small"
            min={0}
            max={canvasWidth}
            value={px.x}
            onChange={(value) => handleFieldChange('x', value)}
          />
        </label>
        <label className="board-region-inputs__field">
          <span>Y</span>
          <InputNumber
            size="small"
            min={0}
            max={canvasHeight}
            value={px.y}
            onChange={(value) => handleFieldChange('y', value)}
          />
        </label>
        <label className="board-region-inputs__field">
          <span>寬</span>
          <InputNumber
            size="small"
            min={1}
            max={canvasWidth}
            value={px.width}
            onChange={(value) => handleFieldChange('width', value)}
          />
        </label>
        <label className="board-region-inputs__field">
          <span>高</span>
          <InputNumber
            size="small"
            min={1}
            max={canvasHeight}
            value={px.height}
            onChange={(value) => handleFieldChange('height', value)}
          />
        </label>
      </Space>
    </div>
  );
}

export function BoardPreviewEditor({
  displayName,
  settings,
  images,
  onBlocksChange,
}: BoardPreviewEditorProps) {
  const isPortrait = settings.layout === 'portrait-menu';
  const canvasDims = CANVAS_DIMS[settings.layout];
  const canvasRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selected, setSelected] = useState<BlockKind | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapHint, setSnapHint] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [liveLogo, setLiveLogo] = useState(settings.logoBlockRegion);
  const [liveMain, setLiveMain] = useState(settings.mainBlockRegion);
  const [liveHistory, setLiveHistory] = useState(settings.historyBlockRegion);
  const [liveMenu, setLiveMenu] = useState(settings.menuBlockRegion);
  const lastValidRef = useRef<BlockLayout>({
    logo: settings.logoBlockRegion,
    main: settings.mainBlockRegion,
    history: settings.historyBlockRegion,
    menu: settings.menuBlockRegion,
  });
  const liveBlocksRef = useRef<BlockLayout>({
    logo: liveLogo,
    main: liveMain,
    history: liveHistory,
    menu: liveMenu,
  });
  const dragRef = useRef<DragState | null>(null);
  const guidesRef = useRef<SnapGuide[]>([]);
  const snapHintTimerRef = useRef<number | null>(null);

  liveBlocksRef.current = {
    logo: liveLogo,
    main: liveMain,
    history: liveHistory,
    menu: liveMenu,
  };
  dragRef.current = drag;
  guidesRef.current = guides;

  useEffect(() => {
    const next: BlockLayout = {
      logo: settings.logoBlockRegion,
      main: settings.mainBlockRegion,
      history: settings.historyBlockRegion,
      menu: settings.menuBlockRegion,
    };
    setLiveLogo(next.logo);
    setLiveMain(next.main);
    setLiveHistory(next.history);
    setLiveMenu(next.menu);
    lastValidRef.current = next;
  }, [
    settings.logoBlockRegion,
    settings.mainBlockRegion,
    settings.historyBlockRegion,
    settings.menuBlockRegion,
  ]);


  const getBlockRegion = useCallback(
    (kind: BlockKind): BlockRegion => {
      const blocks = liveBlocksRef.current;
      return blocks[kind];
    },
    [],
  );

  const setBlockRegion = useCallback((kind: BlockKind, region: BlockRegion) => {
    liveBlocksRef.current = {
      ...liveBlocksRef.current,
      [kind]: region,
    };

    if (kind === 'logo') {
      setLiveLogo(region);
      return;
    }
    if (kind === 'main') {
      setLiveMain(region);
      return;
    }
    if (kind === 'history') {
      setLiveHistory(region);
      return;
    }
    setLiveMenu(region);
  }, []);

  const commitBlocks = useCallback(
    (blocks: BlockLayout) => {
      lastValidRef.current = blocks;
      onBlocksChange(blocks);
      setGuides([]);
    },
    [onBlocksChange],
  );

  const finishDrag = useCallback(
    (blocks: BlockLayout) => {
      commitBlocks(blocks);
    },
    [commitBlocks],
  );

  const applyPixelMetrics = useCallback(
    (kind: BlockKind, metrics: PixelMetrics) => {
      const nextRegion = pixelMetricsToRegion(metrics, canvasDims.width, canvasDims.height);
      const nextBlocks: BlockLayout = {
        ...liveBlocksRef.current,
        [kind]: nextRegion,
      };
      setBlockRegion(kind, nextRegion);
      commitBlocks(nextBlocks);
    },
    [canvasDims.height, canvasDims.width, commitBlocks, setBlockRegion],
  );

  useEffect(() => {
    return () => {
      if (snapHintTimerRef.current !== null) {
        window.clearTimeout(snapHintTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!drag) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dxPct = pxToPct(event.clientX - drag.startX, rect.width);
      const dyPct = pxToPct(event.clientY - drag.startY, rect.height);

      const otherBlocks = (['logo', 'main', 'history', 'menu'] as BlockKind[])
        .filter((kind) => kind !== drag.kind)
        .map((kind) => getBlockRegion(kind));

      let next: BlockRegion;
      if (drag.mode === 'move') {
        next = clampRegion({
          ...drag.origin,
          x: drag.origin.x + dxPct,
          y: drag.origin.y + dyPct,
        });
      } else if (drag.handle) {
        next = applyResize(drag.origin, drag.handle, dxPct, dyPct);
      } else {
        return;
      }

      if (snapEnabled) {
        const snapped = collectSnapGuides(next, rect.width, rect.height, otherBlocks);
        setGuides(snapped.guides);
        setBlockRegion(drag.kind, snapped.region);
        return;
      }

      setGuides([]);
      setBlockRegion(drag.kind, next);
    };

    const onUp = () => {
      const activeDrag = dragRef.current;
      if (!activeDrag) {
        return;
      }

      if (snapEnabled && guidesRef.current.length > 0) {
        setSnapHint('已對齊參考線');
        if (snapHintTimerRef.current !== null) {
          window.clearTimeout(snapHintTimerRef.current);
        }
        snapHintTimerRef.current = window.setTimeout(() => {
          setSnapHint(null);
          snapHintTimerRef.current = null;
        }, 1200);
      }

      finishDrag(liveBlocksRef.current);
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, finishDrag, getBlockRegion, setBlockRegion, snapEnabled]);

  const startDrag = (
    kind: BlockKind,
    mode: 'move' | 'resize',
    event: React.PointerEvent,
    handle?: ResizeHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setSnapHint(null);
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setSelected(kind);
    const origin = getBlockRegion(kind);
    setDrag({
      kind,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...origin },
    });
  };

  const selectedRegion = selected ? getBlockRegion(selected) : null;

  const renderBlock = (
    kind: BlockKind,
    region: BlockRegion,
    content: React.ReactNode,
    label: string,
  ) => {
    const isActive = selected === kind || drag?.kind === kind;
    const isDragging = drag?.kind === kind;
    const isSnapped = snapEnabled && isDragging && guides.length > 0;

    return (
      <div
        className={[
          'board-block',
          `board-block--${kind}`,
          isActive ? 'board-block--selected' : '',
          isDragging ? 'board-block--dragging' : '',
          isSnapped ? 'board-block--snapped' : '',
        ].filter(Boolean).join(' ')}
        style={regionStyle(region)}
        onPointerDown={(e) => startDrag(kind, 'move', e)}
      >
        <span className="board-block-label">{label}</span>
        {content}
        {HANDLES.map((handle) => (
          <div
            key={handle}
            className={`board-handle board-handle--${handle}`}
            onPointerDown={(e) => startDrag(kind, 'resize', e, handle)}
          />
        ))}
      </div>
    );
  };

  const zoomIn = () => {
    setZoom((current) => Math.min(ZOOM_MAX, Number((current + ZOOM_STEP).toFixed(2))));
  };

  const zoomOut = () => {
    setZoom((current) => Math.max(ZOOM_MIN, Number((current - ZOOM_STEP).toFixed(2))));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <div className="board-preview-editor">
      <div className="board-preview-toolbar">
        <Space size="small">
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            aria-label="放大預覽"
          />
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            aria-label="縮小預覽"
          />
          <Button size="small" onClick={resetZoom} disabled={zoom === 1}>
            重置
          </Button>
          <Typography.Text type="secondary" className="board-preview-zoom-label">
            {Math.round(zoom * 100)}%
          </Typography.Text>
        </Space>
        <Space size={4} align="center">
          <Typography.Text type="secondary" className="board-preview-snap-label">
            吸附：
          </Typography.Text>
          <Switch
            size="small"
            checked={snapEnabled}
            onChange={setSnapEnabled}
            checkedChildren="開"
            unCheckedChildren="關"
          />
          {snapHint && (
            <Typography.Text type="secondary" className="board-preview-snap-hint">
              {snapHint}
            </Typography.Text>
          )}
        </Space>
      </div>

      <div className="board-preview-viewport">
          <div
            ref={canvasRef}
            className={`board-canvas ${isPortrait ? 'board-canvas--portrait' : 'board-canvas--landscape'}`}
            style={{ '--board-zoom': zoom } as CSSProperties}
            onPointerDown={() => setSelected(null)}
          >
            {images.backgroundPreviewUrl ? (
              <img
                className="board-bg"
                src={images.backgroundPreviewUrl}
                alt="底圖"
              />
            ) : (
              <div className="board-bg board-bg--fallback" />
            )}

            {renderBlock(
              'menu',
              liveMenu,
              images.menuPreviewUrl ? (
                <img src={images.menuPreviewUrl} alt="菜單" className="board-zone-img" />
              ) : (
                <span className="board-zone-placeholder">
                  {isPortrait ? '菜單區' : '廣告區'}
                </span>
              ),
              isPortrait ? '菜單區' : '廣告區',
            )}

            {renderBlock(
              'logo',
              liveLogo,
              images.logoPreviewUrl ? (
                <img src={images.logoPreviewUrl} alt="Logo" className="board-zone-img" />
              ) : (
                <span className="board-zone-placeholder board-logo-fallback">{displayName}</span>
              ),
              'Logo',
            )}

            {renderBlock(
              'main',
              liveMain,
              <Typography.Title
                level={1}
                className="board-main-number"
                style={{ fontSize: settings.mainNumberSize }}
              >
                A128
              </Typography.Title>,
              BLOCK_LABELS.main,
            )}

            {renderBlock(
              'history',
              liveHistory,
              <BoardHistoryPreview intervalSec={settings.historyPageIntervalSec} />,
              BLOCK_LABELS.history,
            )}

            {snapEnabled && guides.map((guide, i) => (
              <div
                key={`${guide.orientation}-${guide.positionPx}-${i}`}
                className={`board-guide board-guide--${guide.orientation}`}
                style={
                  guide.orientation === 'vertical'
                    ? { left: guide.positionPx }
                    : { top: guide.positionPx }
                }
              />
            ))}
          </div>
      </div>

      {selected && selectedRegion && (
        <BlockRegionInputs
          kind={selected}
          region={selectedRegion}
          canvasWidth={canvasDims.width}
          canvasHeight={canvasDims.height}
          onChange={(metrics) => applyPixelMetrics(selected, metrics)}
        />
      )}

      <div className="board-preview-caption">
        {displayName} · {isPortrait ? '直式 1080×1920' : '橫式 1920×1080'} · 拖曳四區塊調整
      </div>
    </div>
  );
}
