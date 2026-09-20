import { SyncOutlined } from '@ant-design/icons';
import { Typography, message } from 'antd';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { BlockRegion, BrandDisplaySettings, BrandImages } from '../types/brand';
import {
  clampRegion,
  getZonesForLayout,
  validateBlockLayout,
  type SnapGuide,
} from '../utils/block-safety';
import './board-preview-editor.css';

type BlockKind = 'main' | 'history';
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
  onBlocksChange: (main: BlockRegion, history: BlockRegion) => void;
}

interface DragState {
  kind: BlockKind;
  mode: 'move' | 'resize';
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  origin: BlockRegion;
}

const SNAP_PX = 6;
const MIN_BLOCK_PCT = 8;

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

function collectSnapGuides(
  region: BlockRegion,
  canvasW: number,
  canvasH: number,
  other: BlockRegion | null,
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

  const xTargets = [0, canvasW / 2, canvasW];
  const yTargets = [0, canvasH / 2, canvasH];

  if (other) {
    xTargets.push(
      pctToPx(other.x, canvasW),
      pctToPx(other.x + other.width / 2, canvasW),
      pctToPx(other.x + other.width, canvasW),
    );
    yTargets.push(
      pctToPx(other.y, canvasH),
      pctToPx(other.y + other.height / 2, canvasH),
      pctToPx(other.y + other.height, canvasH),
    );
  }

  for (const snap of xSnaps) {
    for (const target of xTargets) {
      if (Math.abs(snap.edge - target) <= SNAP_PX) {
        snap.setX(target);
        guides.push({ orientation: 'vertical', positionPx: target });
        break;
      }
    }
  }

  for (const snap of ySnaps) {
    for (const target of yTargets) {
      if (Math.abs(snap.edge - target) <= SNAP_PX) {
        snap.setY(target);
        guides.push({ orientation: 'horizontal', positionPx: target });
        break;
      }
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

export function BoardPreviewEditor({
  displayName,
  settings,
  images,
  onBlocksChange,
}: BoardPreviewEditorProps) {
  const isPortrait = settings.layout === 'portrait-menu';
  const zones = getZonesForLayout(settings.layout);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [liveMain, setLiveMain] = useState(settings.mainBlockRegion);
  const [liveHistory, setLiveHistory] = useState(settings.historyBlockRegion);
  const lastValidRef = useRef({
    main: settings.mainBlockRegion,
    history: settings.historyBlockRegion,
  });
  const liveMainRef = useRef(liveMain);
  const liveHistoryRef = useRef(liveHistory);
  const dragRef = useRef<DragState | null>(null);

  liveMainRef.current = liveMain;
  liveHistoryRef.current = liveHistory;
  dragRef.current = drag;

  useEffect(() => {
    setLiveMain(settings.mainBlockRegion);
    setLiveHistory(settings.historyBlockRegion);
    lastValidRef.current = {
      main: settings.mainBlockRegion,
      history: settings.historyBlockRegion,
    };
  }, [settings.mainBlockRegion, settings.historyBlockRegion]);

  const hasLogo = Boolean(images.logoPreviewUrl);
  const hasMenu = Boolean(images.menuPreviewUrl);

  const finishDrag = useCallback(
    (main: BlockRegion, history: BlockRegion, movedBlock: BlockKind) => {
      const result = validateBlockLayout(
        main,
        history,
        settings.layout,
        hasLogo,
        hasMenu,
        movedBlock,
      );

      if (!result.valid && result.message) {
        message.warning(result.message);
        setLiveMain(lastValidRef.current.main);
        setLiveHistory(lastValidRef.current.history);
        setGuides([]);
        return;
      }

      lastValidRef.current = { main, history };
      onBlocksChange(main, history);
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

      const otherKind: BlockKind = drag.kind === 'main' ? 'history' : 'main';
      const otherBlock =
        otherKind === 'main' ? liveMain : liveHistory;

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

      const snapped = collectSnapGuides(next, rect.width, rect.height, otherBlock);
      setGuides(snapped.guides);

      if (drag.kind === 'main') {
        setLiveMain(snapped.region);
      } else {
        setLiveHistory(snapped.region);
      }
    };

    const onUp = () => {
      const activeDrag = dragRef.current;
      if (!activeDrag) {
        return;
      }

      finishDrag(
        liveMainRef.current,
        liveHistoryRef.current,
        activeDrag.kind,
      );
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, finishDrag, liveHistory, liveMain, settings.historyBlockRegion, settings.mainBlockRegion]);

  const startDrag = (
    kind: BlockKind,
    mode: 'move' | 'resize',
    event: React.PointerEvent,
    handle?: ResizeHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const origin = kind === 'main' ? liveMain : liveHistory;
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
  ) => (
    <div
      className={`board-block board-block--${kind}`}
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

  const isCarousel = settings.historyDisplayMode === 'carousel';

  return (
    <div className="board-preview-editor">
      <div
        ref={canvasRef}
        className={`board-canvas ${isPortrait ? 'board-canvas--portrait' : 'board-canvas--landscape'}`}
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

        <div className="board-menu-zone" style={regionStyle(zones.menu)}>
          {images.menuPreviewUrl ? (
            <img src={images.menuPreviewUrl} alt="菜單" className="board-menu-img" />
          ) : (
            <span className="board-zone-placeholder">
              {isPortrait ? '菜單區' : '廣告區'}
            </span>
          )}
        </div>

        <div className="board-logo-zone" style={regionStyle(zones.logo)}>
          {images.logoPreviewUrl ? (
            <img src={images.logoPreviewUrl} alt="Logo" className="board-logo-img" />
          ) : (
            <span className="board-zone-placeholder board-logo-fallback">{displayName}</span>
          )}
        </div>

        <div className="board-safe-frame" style={regionStyle(zones.safeFrame)} />

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
          '主叫號區',
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
          '歷史區',
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
        {displayName} · {isPortrait ? '直式 1080×1920' : '橫式 1920×1080'} · 拖曳調整區塊
      </div>
    </div>
  );
}
