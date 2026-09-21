import { SyncOutlined } from '@ant-design/icons';
import { Typography, message } from 'antd';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { BlockRegion, BrandDisplaySettings, BrandImages, BrandLayout } from '../types/brand';
import {
  clampRegion,
  getZonesForLayout,
  regionToPixelMetrics,
  validateBlockLayout,
  type BlockKind,
  type BlockLayout,
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

const SNAP_PX = 16;
const MIN_BLOCK_PCT = 8;

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
  safeFrame: BlockRegion,
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

  const { xTargets, yTargets } = collectEdgeTargets([safeFrame, ...snapTargets], canvasW, canvasH);

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

function BlockMetrics({
  region,
  canvasWidth,
  canvasHeight,
}: {
  region: BlockRegion;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const px = regionToPixelMetrics(region, canvasWidth, canvasHeight);
  return (
    <div className="board-block-metrics">
      <span>X: {px.x}</span>
      <span>Y: {px.y}</span>
      <span>W: {px.width}</span>
      <span>H: {px.height}</span>
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
  const zones = getZonesForLayout(settings.layout);
  const canvasDims = CANVAS_DIMS[settings.layout];
  const canvasRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selected, setSelected] = useState<BlockKind | null>(null);
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

  liveBlocksRef.current = {
    logo: liveLogo,
    main: liveMain,
    history: liveHistory,
    menu: liveMenu,
  };
  dragRef.current = drag;

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

  const hasLogo = Boolean(images.logoPreviewUrl);
  const hasMenu = Boolean(images.menuPreviewUrl);

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

  const finishDrag = useCallback(
    (blocks: BlockLayout, movedBlock: BlockKind) => {
      const result = validateBlockLayout(
        blocks,
        settings.layout,
        hasLogo,
        hasMenu,
        movedBlock,
      );

      if (!result.valid && result.message) {
        message.warning(result.message);
        setLiveLogo(lastValidRef.current.logo);
        setLiveMain(lastValidRef.current.main);
        setLiveHistory(lastValidRef.current.history);
        setLiveMenu(lastValidRef.current.menu);
        setGuides([]);
        return;
      }

      lastValidRef.current = blocks;
      onBlocksChange(blocks);
      setGuides([]);
    },
    [hasLogo, hasMenu, onBlocksChange, settings.layout],
  );

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

      const snapped = collectSnapGuides(next, rect.width, rect.height, otherBlocks, zones.safeFrame);
      setGuides(snapped.guides);
      setBlockRegion(drag.kind, snapped.region);
    };

    const onUp = () => {
      const activeDrag = dragRef.current;
      if (!activeDrag) {
        return;
      }

      finishDrag(liveBlocksRef.current, activeDrag.kind);
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, finishDrag, getBlockRegion, setBlockRegion, zones.safeFrame]);

  const startDrag = (
    kind: BlockKind,
    mode: 'move' | 'resize',
    event: React.PointerEvent,
    handle?: ResizeHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();
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

  const renderBlock = (
    kind: BlockKind,
    region: BlockRegion,
    content: React.ReactNode,
    label: string,
  ) => {
    const isActive = selected === kind || drag?.kind === kind;
    const isSnapped = isActive && guides.length > 0;

    return (
      <div
        className={[
          'board-block',
          `board-block--${kind}`,
          isActive ? 'board-block--selected' : '',
          isSnapped ? 'board-block--snapped' : '',
        ].filter(Boolean).join(' ')}
        style={regionStyle(region)}
        onPointerDown={(e) => startDrag(kind, 'move', e)}
      >
        <span className="board-block-label">{label}</span>
        {isActive && (
          <BlockMetrics
            region={region}
            canvasWidth={canvasDims.width}
            canvasHeight={canvasDims.height}
          />
        )}
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

  const isCarousel = settings.historyDisplayMode === 'carousel';

  return (
    <div className="board-preview-editor">
      <div
        ref={canvasRef}
        className={`board-canvas ${isPortrait ? 'board-canvas--portrait' : 'board-canvas--landscape'}`}
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

        <div className="board-safe-frame" style={regionStyle(zones.safeFrame)} />

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
          <div className="board-history-content">
            {isCarousel && (
              <SyncOutlined spin className="board-history-carousel-icon" />
            )}
            <div className="board-history-chips">
              {Array.from({ length: settings.historyMax }).map((_, i) => (
                <span
                  key={i}
                  className="board-history-chip"
                  style={{ opacity: isCarousel && i > 0 ? 0.5 : 1 }}
                >
                  A{120 + i}
                </span>
              ))}
            </div>
          </div>,
          BLOCK_LABELS.history,
        )}

        {guides.map((guide, i) => (
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
      <div className="board-preview-caption">
        {displayName} · {isPortrait ? '直式 1080×1920' : '橫式 1920×1080'} · 拖曳四區塊調整
      </div>
    </div>
  );
}
