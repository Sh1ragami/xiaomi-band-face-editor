import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { UploadIcon, ImageIcon, TypeIcon, ShapesIcon, LayoutIcon, SettingsIcon, LayersIcon, UndoIcon, RedoIcon, ScissorsIcon, MagicWandIcon, PaletteIcon, EyeIcon, EyeOffIcon, TrashIcon } from "@/shared/icons";
import NavButton from "@/shared/ui/NavButton";
import type { Template } from "@/shared/templates";
import type { Layer, Asset, Crop, ImageLayer, TextLayer, RectLayer, CircleLayer } from "@/shared/types";
import Toolbar from "./components/Toolbar";
import UploadPanel from "./components/panels/UploadPanel";
import TextPanel from "./components/panels/TextPanel";
import ElementsPanel from "./components/panels/ElementsPanel";
import BackgroundPanel from "./components/panels/BackgroundPanel";
import PreviewPanel from "./components/panels/PreviewPanel";
import LayerList from "./components/LayerList";
import CropModal from "./components/modals/CropModal";
import RemoveBgModal from "./components/modals/RemoveBgModal";
import { drawRoundedRectPath, buildRoundedRectPath, getCornerRadiusPx, deg2rad, rotatePoint, pointToLocal, unrotatePoint, drawLayoutPreview, measureTextBox as measureSharedTextBox, getHandleCoords, selectionSize, HandleKey } from "@/shared/canvas";
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

const CANVAS_MARGIN = 200; 

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
export default function CanvasEditor({ template, registerExport }: { template: Template; registerExport?: (fn: (fmt: 'png'|'jpeg', scale: number)=>void) => void }) {
  const { w, h } = template.canvas;
  const [activeTab, setActiveTab] = useState("upload");
  const [previewLayout, setPreviewLayout] = useState<LayoutStyleId | null>(null);
  const [bgColor, setBgColor] = useState("#000000");
  const [viewScale, setViewScale] = useState(1);
  const fitRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const history = useHistory(50);

  const [action, setAction] = useState<null | 'move' | 'resize'>(null); 
  const [activeHandle, setActiveHandle] = useState<null | HandleKey>(null);
  const dragRef = useRef<{ startX: number; startY: number; layerBefore: Layer | null }>({ startX: 0, startY: 0, layerBefore: null });

  const [croppingLayerId, setCroppingLayerId] = useState<string | null>(null);
  const [bgRemovingLayerId, setBgRemovingLayerId] = useState<string | null>(null);

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
        (Object.keys(handles) as HandleKey[]).forEach((k) => {
          if (Math.sqrt((p.x - handles[k].x)**2 + (p.y - handles[k].y)**2) <= 15) {
            setAction("resize"); setActiveHandle(k); dragRef.current = { startX: p.x, startY: p.y, layerBefore: { ...L } }; return;
          }
        });
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
    const drawL = (L: Layer) => {
      if (L.hidden) return;
      ctx.save(); ctx.globalAlpha = L.opacity ?? 1; ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation)); ctx.scale(L.scaleX, L.scaleY);
      if (L.type === "image" && (L as ImageLayer).image) {
        ctx.filter = `brightness(${L.brightness ?? 100}%) contrast(${L.contrast ?? 100}%) saturate(${L.saturate ?? 100}%) grayscale(${L.grayscale ?? 0}%)`;
        const cw = L.crop ? L.width! * L.crop.w : L.width!; const ch = L.crop ? L.height! * L.crop.h : L.height!; const cx = L.crop ? L.width! * L.crop.x : 0; const cy = L.crop ? L.height! * L.crop.y : 0;
        ctx.drawImage((L as ImageLayer).image!, cx, cy, cw, ch, -cw/2, -ch/2, cw, ch); ctx.filter = "none";
      } else if (L.type === "rect") { const R = L as RectLayer; ctx.fillStyle = R.fill; ctx.fillRect(-R.width/2, -R.height/2, R.width, R.height); }
      else if (L.type === "circle") { const C = L as CircleLayer; ctx.fillStyle = C.fill; ctx.beginPath(); ctx.ellipse(0,0,C.width/2,C.height/2,0,0,Math.PI*2); ctx.fill(); }
      else if (L.type === "text" || L.type === "clock") { const t = L as TextLayer; ctx.fillStyle = t.color || '#ffffff'; ctx.font = `${t.fontWeight || "700"} ${t.fontSize || 48}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t.text || '', 0, 0); }
      ctx.restore();
    };
    layers.forEach(L => { ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, r); ctx.clip(); drawL(L); ctx.restore(); });
    if (previewLayout) drawLayoutPreview(ctx, w, h, previewLayout);
    ctx.save(); const bT = 16; const bP = new Path2D(); bP.addPath(buildRoundedRectPath(-bT,-bT,w+bT*2,h+bT*2,r+bT)); bP.addPath(buildRoundedRectPath(0,0,w,h,r)); ctx.fillStyle="#111827"; ctx.fill(bP,"evenodd"); ctx.strokeStyle="rgba(255,255,255,0.15)"; ctx.lineWidth=2; ctx.stroke(buildRoundedRectPath(0,0,w,h,r)); ctx.restore();
    if (selectedId && !croppingLayerId && !bgRemovingLayerId) {
      const L = layers.find(l => l.id === selectedId);
      if (L && !L.hidden) {
        ctx.save(); ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation));
        const sel = selectionSize(L);
        ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2; ctx.setLineDash([4, 2]); ctx.strokeRect(-sel.w / 2, -sel.h / 2, sel.w, sel.h); ctx.restore();
        const handles = getHandleCoords(L); ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2;
        (Object.keys(handles) as HandleKey[]).forEach((k) => { ctx.beginPath(); ctx.arc(handles[k].x, handles[k].y, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke(); });
      }
    }
    ctx.restore();
  }, [layers, selectedId, w, h, bgColor, template, croppingLayerId, bgRemovingLayerId, previewLayout]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = (fitRef.current as HTMLElement);
      setViewScale(Math.max(0.2, Math.min((clientWidth - 120) / w, (clientHeight - 120) / h)));
    });
    ro.observe(fitRef.current as HTMLElement); return () => ro.disconnect();
  }, [w, h]);

  useEffect(() => {
    if (registerExport) registerExport((fmt, scale) => {
      const outW = Math.round(w * scale), outH = Math.round(h * scale), off = document.createElement("canvas");
      off.width = outW; off.height = outH; const ctx = off.getContext("2d")!; ctx.scale(scale, scale);
      ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, getCornerRadiusPx(w, h, template)); ctx.clip(); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);
      (layers as Layer[]).forEach(L => {
        if (L.hidden) return;
        ctx.save(); ctx.globalAlpha = L.opacity ?? 1; ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation)); ctx.scale(L.scaleX, L.scaleY);
        if (L.type === "image" && (L as ImageLayer).image) {
          ctx.filter = `brightness(${L.brightness ?? 100}%) contrast(${L.contrast ?? 100}%) saturate(${L.saturate ?? 100}%) grayscale(${L.grayscale ?? 0}%)`;
          const cw = L.crop ? L.width! * L.crop.w : L.width!; const ch = L.crop ? L.height! * L.crop.h : L.height!; const cx = L.crop ? L.width! * L.crop.x : 0; const cy = L.crop ? L.height! * L.crop.y : 0;
          ctx.drawImage((L as ImageLayer).image!, cx, cy, cw, ch, -cw/2, -ch/2, cw, ch); ctx.filter = "none";
        } else if (L.type === "rect") { const R = L as RectLayer; ctx.fillStyle = R.fill; ctx.fillRect(-R.width/2, -R.height/2, R.width, R.height); }
        else if (L.type === "circle") { const C = L as CircleLayer; ctx.fillStyle = C.fill; ctx.beginPath(); ctx.ellipse(0,0,C.width/2,C.height/2,0,0,Math.PI*2); ctx.fill(); }
        else if (L.type === "text" || L.type === "clock") { const t = L as TextLayer; ctx.fillStyle = t.color || '#ffffff'; ctx.font = `${t.fontWeight || "700"} ${t.fontSize || 48}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t.text || '', 0, 0); }
        ctx.restore();
      });
      ctx.restore();
      const a = document.createElement("a"); a.href = off.toDataURL(fmt === "png" ? "image/png" : "image/jpeg", 0.9); a.download = `watchface.${fmt}`; a.click();
    });
  }, [registerExport, layers, bgColor, w, h, template]);

  const selectedLayer = layers.find(l => l.id === selectedId);
  const [showFilters, setShowFilters] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

  const handleLayerDrop = useCallback((targetId: string) => {
    reorder(draggingLayerId, targetId);
    setDragOverLayerId(null);
    setDraggingLayerId(null);
  }, [draggingLayerId, recordHistory]);

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

      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 transition-all duration-300">
        <div className="p-5 flex-1 overflow-y-auto thin-scrollbar">
          {activeTab === "upload" && (<UploadPanel assets={assets} onUpload={handleFileUpload} onAddImage={addImageToCanvas} />)}
          {activeTab === "text" && (<TextPanel onAdd={(p)=>addLayer({ ...p, x: w/2, y: h/2 })} />)}
          {activeTab === "elements" && (<ElementsPanel onAdd={(p)=>addLayer({ ...p, x: w/2, y: h/2 })} />)}
          {activeTab === "background" && (<BackgroundPanel value={bgColor} onChange={(c)=>{ setBgColor(c); setTimeout(recordHistory,0); }} />)}
          {activeTab === "layout" && (<PreviewPanel styles={LAYOUT_STYLES} selected={previewLayout} onSelect={setPreviewLayout} template={template} />)}
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
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 overflow-x-auto thin-scrollbar">
          <Toolbar
            selectedLayer={selectedLayer as Layer}
            updateSelected={updateSelected}
            setCroppingLayerId={setCroppingLayerId}
            setBgRemovingLayerId={setBgRemovingLayerId}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            deleteSelected={deleteSelected}
          />
        </div>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8" ref={fitRef}>
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           <div className="relative">
             <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} className="relative touch-none cursor-grab active:cursor-grabbing" style={{ width: (w + CANVAS_MARGIN*2) * viewScale, height: (h + CANVAS_MARGIN*2) * viewScale, background: 'transparent' }} />
           </div>
            <div className="absolute bottom-6 right-6 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex items-center gap-2"><button onClick={() => setViewScale(s => Math.max(0.1, s - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-600">-</button><span className="text-xs font-medium w-12 text-center text-gray-500">{Math.round(viewScale * 100)}%</span><button onClick={() => setViewScale(s => Math.min(3, s + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-600">+</button></div>
            <div className="absolute bottom-6 left-6 flex gap-2"><button onClick={undo} disabled={!history.canUndo} className="p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 disabled:opacity-50 hover:bg-gray-50"><UndoIcon className="w-5 h-5" /></button><button onClick={redo} disabled={!history.canRedo} className="p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 disabled:opacity-50 hover:bg-gray-50"><RedoIcon className="w-5 h-5" /></button></div>
        </div>
      </main>

      {croppingLayerId && layers.find(l=>l.id===croppingLayerId && l.type==='image') && ( <CropModal layer={layers.find(l=>l.id===croppingLayerId) as ImageLayer} onClose={()=>setCroppingLayerId(null)} onSave={(newCrop: Crop) => { updateLayer(croppingLayerId, { crop: newCrop }, true); setCroppingLayerId(null); }} /> )}
      {bgRemovingLayerId && layers.find(l=>l.id===bgRemovingLayerId && l.type==='image') && ( <RemoveBgModal layer={layers.find(l=>l.id===bgRemovingLayerId) as ImageLayer} onClose={()=>setBgRemovingLayerId(null)} onSave={(newImg: HTMLImageElement, newUrl: string) => { updateLayer(bgRemovingLayerId, { image: newImg, src: newUrl }, true); setBgRemovingLayerId(null); }} /> )}
    </div>
  );
}
