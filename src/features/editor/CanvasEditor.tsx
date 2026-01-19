import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { UploadIcon, ImageIcon, TypeIcon, ShapesIcon, LayoutIcon, SettingsIcon, LayersIcon, UndoIcon, RedoIcon, ScissorsIcon, PaletteIcon, EyeIcon, EyeOffIcon, TrashIcon } from "@/shared/icons";
import NavButton from "@/shared/ui/NavButton";
import type { Template } from "@/shared/templates";
import type { Layer, Asset, Crop, ImageLayer, TextLayer, RectLayer, CircleLayer } from "@/shared/types";
import Toolbar from "./components/Toolbar";
import UploadPanel from "./components/panels/UploadPanel";
import TextPanel from "./components/panels/TextPanel";
import ElementsPanel from "./components/panels/ElementsPanel";
import BackgroundPanel from "./components/panels/BackgroundPanel";
import PreviewPanel from "./components/panels/PreviewPanel";
import EffectsPanel from "./components/panels/EffectsPanel";
import LayerList from "./components/LayerList";
import CropModal from "./components/modals/CropModal";
import RemoveBgModal from "./components/modals/RemoveBgModal";
// EffectModal removed in favor of left-pane EffectsPanel
import { drawRoundedRectPath, buildRoundedRectPath, getCornerRadiusPx, deg2rad, rotatePoint, pointToLocal, unrotatePoint, drawLayoutPreview, measureTextBox as measureSharedTextBox, getHandleCoords, selectionSize, HandleKey, applyDecorations, drawText } from "@/shared/canvas";
import useHistory from "./hooks/useHistory";
import useLayers from "./hooks/useLayers";


// pointToLocal is imported from shared/canvas

// Processing: Remove Color
const processRemoveColor = (canvas: HTMLCanvasElement, targetHex: string, tolerance: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const rT = parseInt(targetHex.slice(1, 3), 16);
    const gT = parseInt(targetHex.slice(3, 5), 16);
    const bT = parseInt(targetHex.slice(5, 7), 16);
    const tol = tolerance * 2.55;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = Math.sqrt((r - rT)**2 + (g - gT)**2 + (b - bT)**2);
        if (dist <= tol) {
            data[i + 3] = 0;
        }
    }
    ctx.putImageData(imageData, 0, 0);
};

const CANVAS_MARGIN = 300; 

// --- Layout Styles Definition ---
type LayoutStyleId = 'none'|'style1'|'style2'|'style3'|'style4'|'style5';
const LAYOUT_STYLES: { id: LayoutStyleId; label: string; type?: string }[] = [
  { id: 'none', label: 'なし' },
  { id: 'style1', label: 'Photo display 1', type: 'bottom' },
  { id: 'style2', label: 'Photo display 2', type: 'vertical-right' },
  { id: 'style3', label: 'Photo display 3', type: 'vertical-top' },
  { id: 'style4', label: 'Photo display 4', type: 'split' },
  { id: 'style5', label: 'Photo display 5', type: 'bottom-large' },
];

// drawLayoutPreview is imported from shared/canvas

// --- Main Component ---
const drawLayer = (ctx: CanvasRenderingContext2D, L: Layer) => {
  if (L.hidden) return;
  ctx.save(); 
  ctx.globalAlpha = L.opacity ?? 1; 
  ctx.translate(L.x, L.y); 
  ctx.rotate(deg2rad(L.rotation)); 
  ctx.scale(L.scaleX, L.scaleY);
  
  applyDecorations(ctx, L);

  if (L.type === "image" && (L as ImageLayer).image) {
    ctx.filter = `brightness(${L.brightness ?? 100}%) contrast(${L.contrast ?? 100}%) saturate(${L.saturate ?? 100}%) grayscale(${L.grayscale ?? 0}%)`;
    const cw = (L as ImageLayer).crop ? (L as ImageLayer).width! * (L as ImageLayer).crop.w : (L as ImageLayer).width!; 
    const ch = (L as ImageLayer).crop ? (L as ImageLayer).height! * (L as ImageLayer).crop.h : (L as ImageLayer).height!; 
    const cx = (L as ImageLayer).crop ? (L as ImageLayer).width! * (L as ImageLayer).crop.x : 0; 
    const cy = (L as ImageLayer).crop ? (L as ImageLayer).height! * (L as ImageLayer).crop.y : 0;
    ctx.drawImage((L as ImageLayer).image!, cx, cy, cw, ch, -cw/2, -ch/2, cw, ch); ctx.filter = "none";
  } else if (L.type === "rect") { 
    const R = L as RectLayer; 
    ctx.fillStyle = R.fill; 
    ctx.fillRect(-R.width/2, -R.height/2, R.width, R.height);
    if (R.stroke?.enabled) {
      ctx.strokeStyle = R.stroke.color; ctx.lineWidth = R.stroke.width;
      ctx.strokeRect(-R.width/2, -R.height/2, R.width, R.height);
    }
  } else if (L.type === "circle") { 
    const C = L as CircleLayer; 
    ctx.fillStyle = C.fill; ctx.beginPath(); ctx.ellipse(0,0,C.width/2,C.height/2,0,0,Math.PI*2); ctx.fill();
    if (C.stroke?.enabled) {
      ctx.strokeStyle = C.stroke.color; ctx.lineWidth = C.stroke.width; ctx.stroke();
    }
  } else if (L.type === "text" || L.type === "clock") { 
    drawText(ctx, L as TextLayer);
  }
  ctx.restore();
};

export default function CanvasEditor({ template, registerExport }: { template: Template; registerExport?: (fn: (fmt: 'png'|'jpeg', scale: number)=>void) => void }) {
  const { w, h } = template.canvas;
  const [activeTab, setActiveTab] = useState("upload");
  const [previewLayout, setPreviewLayout] = useState<LayoutStyleId | null>(null);
  const [bgColor, setBgColor] = useState("#000000");
  const [viewScale, setViewScale] = useState(1);
  const VIEW_MIN = 0.05;
  const VIEW_MAX = Infinity; // no upper limit
  const ZOOM_SENSITIVITY = 0.006; // higher sensitivity
  const autoFitRef = useRef(true);
  const INITIAL_FIT_SHRINK = 0.94; // show a bit more room on first render
  const lastGestureScaleRef = useRef(1);
  const viewScaleRef = useRef(1);
  const spacePressedRef = useRef(false);
  const panDragRef = useRef<{active:boolean;startX:number;startY:number;startPanX:number;startPanY:number}>({active:false,startX:0,startY:0,startPanX:0,startPanY:0});
  const gestureActiveRef = useRef(false);
  const fitRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const history = useHistory(50);

  const [action, setAction] = useState<null | 'move' | 'resize' | 'rotate'>(null); 
  const [activeHandle, setActiveHandle] = useState<null | HandleKey>(null);
  const dragRef = useRef<{ startX: number; startY: number; layerBefore: Layer | null }>({ startX: 0, startY: 0, layerBefore: null });

  const [croppingLayerId, setCroppingLayerId] = useState<string | null>(null);
  const [bgRemovingLayerId, setBgRemovingLayerId] = useState<string | null>(null);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const asideRef = useRef<HTMLDivElement | null>(null);

  const snapshot = useCallback(() => JSON.stringify({
    layers: layers.map(l => {
      if (l.type === 'image') { const { image, ...r } = l as ImageLayer; return r; }
      return l;
    }),
    assets: assets.map(a => { const { image, ...r } = a; return r; }),
    bgColor
  }), [layers, assets, bgColor]);
  const recordHistory = useCallback(() => { if (isLoaded) history.push(snapshot()); }, [history, isLoaded, snapshot]);

  useEffect(() => {
    if (isLoaded && history.index === -1) history.push(snapshot());
  }, [isLoaded, history, snapshot]);

  // Measure text via shared util
  const measureTextBox = useCallback((text?: string, fontSize?: number, fontWeight?: string) => (
    measureSharedTextBox(text || '', fontSize ?? 48, fontWeight ?? '700')
  ), []);

  // Layers helpers (operate on external state)
  const { addLayer, updateLayer, updateSelected, deleteSelected, reorder } = useLayers(
    layers,
    (updater) => setLayers(prev => updater(prev)),
    selectedId,
    setSelectedId,
    measureTextBox,
    () => recordHistory()
  );

  const undo = useCallback(() => {
    const s = history.undo(); if (!s) return; const state = JSON.parse(s) as { bgColor: string; layers: (Omit<ImageLayer,'image'> | Layer)[]; assets?: Omit<Asset,'image'>[] };
    setBgColor(state.bgColor);
    setLayers(state.layers.map((l) => (l as Layer).type === 'image' ? ({ ...(l as Omit<ImageLayer,'image'>), image: Object.assign(new Image(), { src: (l as Omit<ImageLayer,'image'>).src }) } as ImageLayer) : (l as Layer)));
    if (state.assets) setAssets(state.assets.map((a) => ({ ...a, image: Object.assign(new Image(), { src: a.src }) })));
  }, [history]);

  const redo = useCallback(() => {
    const s = history.redo(); if (!s) return; const state = JSON.parse(s) as { bgColor: string; layers: (Omit<ImageLayer,'image'> | Layer)[]; assets?: Omit<Asset,'image'>[] };
    setBgColor(state.bgColor);
    setLayers(state.layers.map((l) => (l as Layer).type === 'image' ? ({ ...(l as Omit<ImageLayer,'image'>), image: Object.assign(new Image(), { src: (l as Omit<ImageLayer,'image'>).src }) } as ImageLayer) : (l as Layer)));
    if (state.assets) setAssets(state.assets.map((a) => ({ ...a, image: Object.assign(new Image(), { src: a.src }) })));
  }, [history]);

  // deleteSelected is provided by useLayers; it deletes the currently selected layer

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement).tagName)) return;
      if ((evt.ctrlKey || evt.metaKey) && evt.key === 'z') {
        if (evt.shiftKey) redo(); else undo(); evt.preventDefault();
      } else if ((evt.ctrlKey || evt.metaKey) && evt.key === 'y') {
        redo(); evt.preventDefault();
      } else if ((evt.key === "Delete" || evt.key === "Backspace") && selectedId && !croppingLayerId && !bgRemovingLayerId) {
      deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selectedId, croppingLayerId, bgRemovingLayerId, deleteSelected]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("xiaomi_editor_state");
      if (saved) {
        const data = JSON.parse(saved) as { bgColor?: string; assets?: Omit<Asset,'image'>[]; layers?: (Omit<ImageLayer,'image'> | Layer)[] };
        if (data.bgColor) setBgColor(data.bgColor);
        if (data.assets) setAssets(data.assets.map(a => ({ ...a, image: Object.assign(new Image(), { src: a.src }) })));
        if (data.layers) setLayers(data.layers.map(l => (l as Layer).type === 'image' ? ({ ...(l as Omit<ImageLayer,'image'>), image: Object.assign(new Image(), { src: (l as Omit<ImageLayer,'image'>).src }) } as ImageLayer) : (l as Layer)));
      }
    } catch (_) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const state = { layers: layers.map(l => l.type === 'image' ? (({ image, ...r }) => r)(l as ImageLayer) : l), assets: assets.map(({ image, ...r }) => r), bgColor };
    try { localStorage.setItem("xiaomi_editor_state", JSON.stringify(state)); } catch (e) {}
  }, [layers, assets, bgColor, isLoaded]);

  // addLayer/updateLayer/updateSelected are provided by useLayers

  const handleFileUpload = useCallback((files: FileList | null) => {
    Array.from(files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = (e.target as FileReader).result as string; const img = new Image();
        img.onload = () => setAssets(prev => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: file.name, image: img, width: img.width, height: img.height, url: src, src: src }]);
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const addImageToCanvas = useCallback((asset: Asset) => {
    const contain = Math.max(w / asset.width, h / asset.height);
    addLayer({ type: "image", name: asset.name, width: asset.width, height: asset.height, image: asset.image, src: asset.src, scaleX: contain, scaleY: contain });
  }, [addLayer, w, h]);

  const getPointer = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = (w + CANVAS_MARGIN * 2) / rect.width;
    const scaleY = (h + CANVAS_MARGIN * 2) / rect.height;
    return { x: (evt.clientX - rect.left) * scaleX - CANVAS_MARGIN, y: (evt.clientY - rect.top) * scaleY - CANVAS_MARGIN };
  };

  // getHandleCoords is imported from shared/canvas

  const onPointerDown = useCallback((evt: React.PointerEvent<HTMLCanvasElement>) => {
    if (croppingLayerId || bgRemovingLayerId) return;
    const p = getPointer(evt);
    if (selectedId) {
      const L = layers.find(l => l.id === selectedId);
      if (L && !L.locked) {
        const handles = getHandleCoords(L);
        let hitHandle: HandleKey | null = null;
        (Object.keys(handles) as HandleKey[]).forEach((k) => {
          if (Math.sqrt((p.x - handles[k].x)**2 + (p.y - handles[k].y)**2) <= 15) { hitHandle = k; }
        });
        if (hitHandle) {
          if (hitHandle === 'rot') {
             setAction("rotate"); setActiveHandle("rot"); dragRef.current = { startX: p.x, startY: p.y, layerBefore: { ...L } }; return;
          } else {
             setAction("resize"); setActiveHandle(hitHandle); dragRef.current = { startX: p.x, startY: p.y, layerBefore: { ...L } }; return;
          }
        }
      }
    }
    let picked: Layer | null = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i]; if (L.hidden || L.locked) continue;
      const loc = pointToLocal(L, p.x, p.y);
      const cw = L.type === 'image' && L.crop ? L.width! * L.crop.w : L.width!; const ch = L.type === 'image' && L.crop ? L.height! * L.crop.h : L.height!;
      if (Math.abs(loc.x) <= cw/2 && Math.abs(loc.y) <= ch/2) { picked = L; break; }
    }
    if (picked) { setSelectedId(picked.id); dragRef.current = { startX: p.x, startY: p.y, layerBefore: { ...picked } }; setAction("move"); }
    else { setSelectedId(null); setAction(null); }
  }, [layers, selectedId, croppingLayerId, bgRemovingLayerId, w, h]);

  const onPointerMove = useCallback((evt: React.PointerEvent<HTMLCanvasElement>) => {
    if (croppingLayerId || bgRemovingLayerId || !action || !selectedId) return;
    const p = getPointer(evt);
    const L = layers.find(l => l.id === selectedId); if (!L) return;
    const before = dragRef.current.layerBefore as Layer;
    if (action === "move") updateLayer(selectedId, { x: before.x + (p.x - dragRef.current.startX), y: before.y + (p.y - dragRef.current.startY) });
    else if (action === "rotate") {
      const angle = Math.atan2(p.y - before.y, p.x - before.x);
      const startAngle = Math.atan2(dragRef.current.startY - before.y, dragRef.current.startX - before.x);
      updateLayer(selectedId, { rotation: before.rotation + (angle - startAngle) * 180 / Math.PI });
    }
    else if (action === "resize") {
      const sl = unrotatePoint(dragRef.current.startX, dragRef.current.startY, before.x, before.y, before.rotation);
      const cl = unrotatePoint(p.x, p.y, before.x, before.y, before.rotation);
      const dx = cl.x - sl.x; const dy = cl.y - sl.y;
      let dLx = 0, dRx = 0, dTy = 0, dBy = 0;
      if ((activeHandle as HandleKey)?.includes('l')) dLx = dx; if ((activeHandle as HandleKey)?.includes('r')) dRx = dx; if ((activeHandle as HandleKey)?.includes('t')) dTy = dy; if ((activeHandle as HandleKey)?.includes('b')) dBy = dy;
      const cw = before.type === 'image' && before.crop ? before.width! * before.crop.w : before.width!; const ch = before.type === 'image' && before.crop ? before.height! * before.crop.h : before.height!;
      if ((activeHandle as HandleKey)?.length === 2) {
        let rw = cw * before.scaleX + (dRx - dLx); let rh = ch * before.scaleY + (dBy - dTy);
        const ratio = (cw * before.scaleX) / (ch * before.scaleY);
        if (Math.abs(rw - cw * before.scaleX) > Math.abs(rh - ch * before.scaleY)) { rh = rw / ratio; if ((activeHandle as HandleKey)?.includes('b')) dBy = rh - ch * before.scaleY; else dTy = -(rh - ch * before.scaleY); }
        else { rw = rh * ratio; if ((activeHandle as HandleKey)?.includes('r')) dRx = rw - cw * before.scaleX; else dLx = -(rw - cw * before.scaleX); }
      }
      const hw = (cw * before.scaleX) / 2; const hh = (ch * before.scaleY) / 2;
      const l = -hw + dLx, r = hw + dRx, t = -hh + dTy, b = hh + dBy;
      const worldDisp = rotatePoint((l + r) / 2, (t + b) / 2, 0, 0, before.rotation);
      updateLayer(selectedId, { scaleX: Math.abs(r - l) / cw, scaleY: Math.abs(b - t) / ch, x: before.x + worldDisp.x, y: before.y + worldDisp.y });
    }
  }, [action, selectedId, layers, activeHandle, croppingLayerId, bgRemovingLayerId, updateLayer]);

  const onPointerUp = useCallback(() => { 
    if (action) recordHistory();
    setAction(null); setActiveHandle(null); 
  }, [action, recordHistory]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = w + CANVAS_MARGIN * 2; canvas.height = h + CANVAS_MARGIN * 2;
    ctx.save(); ctx.translate(CANVAS_MARGIN, CANVAS_MARGIN);
        const r = getCornerRadiusPx(w, h, template);
        ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, r); ctx.clip(); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h); ctx.restore();
        
        layers.forEach(L => { ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, r); ctx.clip(); drawLayer(ctx, L); ctx.restore(); });
        if (previewLayout) drawLayoutPreview(ctx, w, h, previewLayout);
    
    ctx.save(); const bT = 16; const bP = new Path2D(); bP.addPath(buildRoundedRectPath(-bT,-bT,w+bT*2,h+bT*2,r+bT)); bP.addPath(buildRoundedRectPath(0,0,w,h,r)); ctx.fillStyle="#111827"; ctx.fill(bP,"evenodd"); ctx.strokeStyle="rgba(255,255,255,0.15)"; ctx.lineWidth=2; ctx.stroke(buildRoundedRectPath(0,0,w,h,r)); ctx.restore();
    if (selectedId && !croppingLayerId && !bgRemovingLayerId) {
      const L = layers.find(l => l.id === selectedId);
      if (L && !L.hidden) {
        ctx.save(); ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation));
        const sel = selectionSize(L);
        ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2; ctx.setLineDash([4, 2]); ctx.strokeRect(-sel.w / 2, -sel.h / 2, sel.w, sel.h); ctx.restore();
        const handles = getHandleCoords(L); 
        // Draw rotation handle line
        if (handles.rot) {
           ctx.save(); ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2; ctx.setLineDash([4, 2]);
           ctx.beginPath(); ctx.moveTo(handles.t.x, handles.t.y); ctx.lineTo(handles.rot.x, handles.rot.y); ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2;
        (Object.keys(handles) as HandleKey[]).forEach((k) => {
          ctx.save();
          if (k === 'rot') { ctx.fillStyle = "#8b5cf6"; ctx.strokeStyle = "#ffffff"; }
          ctx.beginPath(); ctx.arc(handles[k].x, handles[k].y, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.restore();
        });
      }
    }
    ctx.restore();
  }, [layers, selectedId, w, h, bgColor, template, croppingLayerId, bgRemovingLayerId, previewLayout]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const el = fitRef.current as HTMLElement | null;
      if (!el) return;
      const { clientWidth, clientHeight } = el;
      // Fit to the face area so it uses full space; margin remains offscreen editing buffer
      const fit = Math.max(0.05, Math.min(clientWidth / w, clientHeight / h));
      if (autoFitRef.current) {
        const s = fit * INITIAL_FIT_SHRINK;
        setViewScale(s);
        // Center the stage for initial fit (use scaled stage size)
        setPanX((clientWidth - s * (w + CANVAS_MARGIN*2)) / 2);
        setPanY((clientHeight - s * (h + CANVAS_MARGIN*2)) / 2);
      }
    });
    const el = fitRef.current as HTMLElement | null;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  useEffect(() => { viewScaleRef.current = viewScale; }, [viewScale]);

  // Spacebar pan mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') { spacePressedRef.current = true; e.preventDefault(); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { spacePressedRef.current = false; } };
    window.addEventListener('keydown', down, { capture: true });
    window.addEventListener('keyup', up, { capture: true });
    return () => { window.removeEventListener('keydown', down, { capture: true } as any); window.removeEventListener('keyup', up, { capture: true } as any); };
  }, []);

  // Prevent browser zoom globally on pinch/ctrl+wheel; apply our zoom only when over the preview area
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const container = fitRef.current as HTMLElement | null;
      const target = e.target as Node | null;
      const inside = !!(container && target && container.contains(target));
      if (!inside) return;
      if (e.ctrlKey) {
        if (gestureActiveRef.current) { e.preventDefault(); return; }
        e.preventDefault();
        autoFitRef.current = false;
        const delta = -e.deltaY;
        const factor = Math.exp(delta * ZOOM_SENSITIVITY);
        if (container) {
          const cont = container.getBoundingClientRect();
          const mX = e.clientX - cont.left;
          const mY = e.clientY - cont.top;
          // Anchor zoom at cursor in container coordinates
          setPanX((px) => px + (1 - factor) * (mX - px));
          setPanY((py) => py + (1 - factor) * (mY - py));
        }
        setViewScale((s) => Math.max(VIEW_MIN, s * factor));
      } else {
        // two-finger scroll pans the stage
        e.preventDefault();
        setPanX((px) => px - e.deltaX);
        setPanY((py) => py - e.deltaY);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });

    const onGestureStart = (e: any) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      gestureActiveRef.current = true;
      lastGestureScaleRef.current = 1;
    };
    const onGestureChange = (e: any) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      const container = fitRef.current as HTMLElement | null;
      const target = e.target as Node | null;
      const inside = !!(container && target && container.contains(target));
      if (!inside) return;
      autoFitRef.current = false;
      const scale = e.scale || 1;
      const factor = scale / (lastGestureScaleRef.current || 1);
      lastGestureScaleRef.current = scale;
      if (container && (e as any).clientX != null && (e as any).clientY != null) {
        const cont = container.getBoundingClientRect();
        const mX = (e as any).clientX - cont.left;
        const mY = (e as any).clientY - cont.top;
        setPanX((px) => px + (1 - factor) * (mX - px));
        setPanY((py) => py + (1 - factor) * (mY - py));
      }
      setViewScale((s) => Math.max(VIEW_MIN, s * factor));
    };
    const onGestureEnd = (e: any) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      gestureActiveRef.current = false;
      lastGestureScaleRef.current = 1;
    };
    window.addEventListener('gesturestart', onGestureStart as any, { passive: false } as any);
    window.addEventListener('gesturechange', onGestureChange as any, { passive: false } as any);
    window.addEventListener('gestureend', onGestureEnd as any, { passive: false } as any);

    return () => {
      window.removeEventListener('wheel', onWheel as any);
      window.removeEventListener('gesturestart', onGestureStart as any);
      window.removeEventListener('gesturechange', onGestureChange as any);
      window.removeEventListener('gestureend', onGestureEnd as any);
    };
  }, []);

  // Removed center/fit UI per request

  useEffect(() => {
    if (registerExport) registerExport((fmt, scale) => {
      const outW = Math.round(w * scale), outH = Math.round(h * scale), off = document.createElement("canvas");
      off.width = outW; off.height = outH; const ctx = off.getContext("2d")!; ctx.scale(scale, scale);
      ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, getCornerRadiusPx(w, h, template)); ctx.clip(); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);
      layers.forEach(L => { ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, getCornerRadiusPx(w, h, template)); ctx.clip(); drawLayer(ctx, L); ctx.restore(); });
      ctx.restore();
      const a = document.createElement("a"); a.href = off.toDataURL(fmt === "png" ? "image/png" : "image/jpeg", 0.9); a.download = `watchface.${fmt}`; a.click();
    });
  }, [registerExport, layers, bgColor, w, h, template]);

  const selectedLayer = layers.find(l => l.id === selectedId);
  const [showFilters, setShowFilters] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const handleLayerDrop = useCallback((targetId: string) => {
    reorder(draggingLayerId, targetId);
    setDragOverLayerId(null);
    setDraggingLayerId(null);
  }, [draggingLayerId, recordHistory]);

  // Close effects pane when nothing is selected
  useEffect(() => {
    if (!selectedId) setShowEffectsPanel(false);
  }, [selectedId]);

  // Close effects pane if user switches the left nav tab
  useEffect(() => {
    setShowEffectsPanel(false);
  }, [activeTab]);

  // Close effects pane when clicking outside the left panel
  useEffect(() => {
    if (!showEffectsPanel) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (asideRef.current && t && asideRef.current.contains(t)) return;
      setShowEffectsPanel(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showEffectsPanel]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <nav className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-6 shrink-0 z-10">
        <NavButton icon={UploadIcon} label="アップロード" active={activeTab === "upload"} onClick={() => setActiveTab("upload")} />
        <NavButton icon={TypeIcon} label="テキスト" active={activeTab === "text"} onClick={() => setActiveTab("text")} />
        <NavButton icon={ShapesIcon} label="素材" active={activeTab === "elements"} onClick={() => setActiveTab("elements")} />
        <NavButton icon={SettingsIcon} label="背景" active={activeTab === "background"} onClick={() => setActiveTab("background")} />
        <NavButton icon={LayoutIcon} label="レイアウト" active={activeTab === "layout"} onClick={() => setActiveTab("layout")} />
        <NavButton icon={LayersIcon} label="レイヤー" active={activeTab === "layers"} onClick={() => setActiveTab("layers")} />
      </nav>

      <aside ref={asideRef} className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 transition-all duration-300">
        <div className="p-5 flex-1 overflow-y-auto thin-scrollbar">
          {showEffectsPanel ? (
            <EffectsPanel selectedLayer={selectedLayer as Layer} updateSelected={updateSelected} onClose={() => setShowEffectsPanel(false)} />
          ) : (
            <>
              {activeTab === "upload" && (<UploadPanel assets={assets} onUpload={handleFileUpload} onAddImage={addImageToCanvas} />)}
              {activeTab === "text" && (<TextPanel onAdd={(p)=>addLayer({ ...p, x: w/2, y: h/2 })} />)}
              {activeTab === "elements" && (<ElementsPanel onAdd={(p)=>addLayer({ ...p, x: w/2, y: h/2 })} />)}
              {activeTab === "background" && (<BackgroundPanel value={bgColor} onChange={(c)=>{ setBgColor(c); setTimeout(recordHistory,0); }} />)}
              {activeTab === "layout" && (
                <PreviewPanel
                  styles={LAYOUT_STYLES}
                  selected={previewLayout}
                  onSelect={(id) => setPreviewLayout((id ?? null) as LayoutStyleId | null)}
                  template={template}
                />
              )}
              {activeTab === "layers" && (
                <LayerList
                  layers={layers}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onToggleHidden={(id)=>{ const target = layers.find(l=>l.id===id); if (!target) return; updateLayer(id, { hidden: !target.hidden }, true); }}
                  onDelete={(id)=>{ setSelectedId(id); deleteSelected(); }}
                  draggingLayerId={draggingLayerId}
                  setDraggingLayerId={setDraggingLayerId}
                  dragOverLayerId={dragOverLayerId}
                  setDragOverLayerId={setDragOverLayerId}
                  onDrop={handleLayerDrop}
                />
              )}
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 overflow-x-auto thin-scrollbar">
          <Toolbar
            selectedLayer={selectedLayer as Layer}
            updateSelected={updateSelected}
            setCroppingLayerId={setCroppingLayerId}
            setBgRemovingLayerId={setBgRemovingLayerId}
            openEffectsPanel={() => setShowEffectsPanel(true)}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            deleteSelected={deleteSelected}
          />
        </div>

        <div
          className="flex-1 relative overflow-hidden p-0"
          ref={fitRef}
          onPointerDown={(e)=>{
            if (e.button === 1 || spacePressedRef.current) {
              e.preventDefault(); e.stopPropagation();
              const el = e.currentTarget as HTMLElement; try { el.setPointerCapture(e.pointerId); } catch {}
              panDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
            }
          }}
          onPointerMove={(e)=>{
            if (panDragRef.current.active) {
              e.preventDefault(); e.stopPropagation();
              const dx = e.clientX - panDragRef.current.startX;
              const dy = e.clientY - panDragRef.current.startY;
              setPanX(panDragRef.current.startPanX + dx);
              setPanY(panDragRef.current.startPanY + dy);
            }
          }}
          onPointerUp={(e)=>{
            if (panDragRef.current.active) {
              e.preventDefault(); e.stopPropagation();
              panDragRef.current.active = false;
              const el = e.currentTarget as HTMLElement; try { el.releasePointerCapture(e.pointerId); } catch {}
            }
          }}
          onPointerLeave={(e)=>{
            if (panDragRef.current.active) {
              panDragRef.current.active = false;
            }
          }}
          style={{ cursor: panDragRef.current.active || spacePressedRef.current ? 'grabbing' : undefined }}
        >
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           <div className="absolute left-0 top-0" ref={stageRef} style={{ transform: `translate(${panX}px, ${panY}px)` }}>
             <div className="relative" style={{ transform: `scale(${viewScale})`, transformOrigin: '0 0' }}>
               <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} className="relative touch-none cursor-grab active:cursor-grabbing" style={{ width: (w + CANVAS_MARGIN*2), height: (h + CANVAS_MARGIN*2), background: 'transparent' }} />
             </div>
           </div>
            <div className="absolute bottom-6 right-6 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex items-center gap-2">
              <button onClick={() => { autoFitRef.current = false; setViewScale(s => Math.max(VIEW_MIN, s - 0.1)); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-600" title="縮小">-</button>
              <span className="text-xs font-medium w-14 text-center text-gray-500">{Math.round(viewScale * 100)}%</span>
              <button onClick={() => { autoFitRef.current = false; setViewScale(s => s + 0.1); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-600" title="拡大">+</button>
            </div>
            <div className="absolute bottom-6 left-6 flex gap-2"><button onClick={undo} disabled={!history.canUndo} className="p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 disabled:opacity-50 hover:bg-gray-50"><UndoIcon className="w-5 h-5" /></button><button onClick={redo} disabled={!history.canRedo} className="p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 disabled:opacity-50 hover:bg-gray-50"><RedoIcon className="w-5 h-5" /></button></div>
        </div>
      </main>

      {croppingLayerId && layers.find(l=>l.id===croppingLayerId && l.type==='image') && ( <CropModal layer={layers.find(l=>l.id===croppingLayerId) as ImageLayer} onClose={()=>setCroppingLayerId(null)} onSave={(newCrop: Crop) => { updateLayer(croppingLayerId, { crop: newCrop }, true); setCroppingLayerId(null); }} /> )}
      {bgRemovingLayerId && layers.find(l=>l.id===bgRemovingLayerId && l.type==='image') && ( <RemoveBgModal layer={layers.find(l=>l.id===bgRemovingLayerId) as ImageLayer} onClose={()=>setBgRemovingLayerId(null)} onSave={(newImg: HTMLImageElement, newUrl: string) => { updateLayer(bgRemovingLayerId, { image: newImg, src: newUrl }, true); setBgRemovingLayerId(null); }} /> )}
      {/* Modal removed: effects are edited in the left pane */}
    </div>
  );
}
