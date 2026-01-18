import { useCallback, useEffect, useRef, useState } from "react";
import { UploadIcon, ImageIcon, TypeIcon, ShapesIcon, LayoutIcon, SettingsIcon, TrashIcon, LayersIcon, UndoIcon, RedoIcon, ScissorsIcon, MagicWandIcon, PaletteIcon, EyeIcon, EyeOffIcon } from "./Icons";
import NavButton from "./NavButton";

// --- Utility Functions ---
function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function buildRoundedRectPath(x, y, w, h, r) {
    const p = new Path2D();
    const radius = Math.min(r, w / 2, h / 2);
    p.moveTo(x + radius, y);
    p.arcTo(x + w, y, x + w, y + h, radius);
    p.arcTo(x + w, y + h, x, y + h, radius);
    p.arcTo(x, y + h, x, y, radius);
    p.arcTo(x, y, x + w, y, radius);
    p.closePath();
    return p;
  }

function getCornerRadiusPx(w, h, template) {
  const t = template.cornerRadius;
  if (t === "pill") return Math.min(w, h) / 2;
  if (typeof t === "number") return Math.min(t, w / 2, h / 2);
  return Math.min(w, h) * 0.16;
}

const deg2rad = (d) => (d * Math.PI) / 180;
const rad2deg = (r) => (r * 180) / Math.PI;

const rotatePoint = (x, y, cx, cy, angleDeg) => {
  const rad = deg2rad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
};

const unrotatePoint = (x, y, cx, cy, angleDeg) => {
    return rotatePoint(x, y, cx, cy, -angleDeg);
};

// Convert world coordinates (x,y) to the local, unscaled/unrotated
// coordinates of a given layer L (centered at L.x, L.y).
function pointToLocal(L, x, y) {
  const dx = x - L.x;
  const dy = y - L.y;
  const r = unrotatePoint(dx, dy, 0, 0, L.rotation);
  const sx = L.scaleX || 1;
  const sy = L.scaleY || 1;
  return { x: r.x / sx, y: r.y / sy };
}

// Processing: Remove Color
const processRemoveColor = (canvas, targetHex, tolerance) => {
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
const LAYOUT_STYLES = [
  { id: 'none', label: 'なし' },
  { id: 'style1', label: 'Photo display 1', type: 'bottom' },
  { id: 'style2', label: 'Photo display 2', type: 'vertical-right' },
  { id: 'style3', label: 'Photo display 3', type: 'vertical-top' },
  { id: 'style4', label: 'Photo display 4', type: 'split' },
  { id: 'style5', label: 'Photo display 5', type: 'bottom-large' },
];

function drawLayoutPreview(ctx, w, h, styleId) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 6;
    // helpers for fitted text and padding
    const padX = w * 0.08;
    const padY = h * 0.06;
    const setFont = (weight, size) => { ctx.font = `${weight} ${Math.round(size)}px sans-serif`; };
    const fitted = (text, weight, basePx, maxWidth) => {
        let size = basePx; setFont(weight, size);
        let width = ctx.measureText(text).width;
        if (width <= maxWidth) return size;
        size = Math.max(8, Math.floor(basePx * (maxWidth / Math.max(1, width))));
        setFont(weight, size);
        return size;
    };

    const date = "AM SAT 16";

    if (styleId === 'style1') {
        // Large time near upper center with safe padding
        const maxW = w - padX * 2;
        const timeSize = fitted("0928", "700", h * 0.18, maxW);
        setFont("700", timeSize);
        ctx.fillText("0928", w/2, padY + timeSize * 0.7);
        const dateSize = Math.max(12, Math.round(timeSize * 0.22));
        setFont("500", dateSize);
        ctx.fillText(date, w/2, padY + timeSize * 0.7 + dateSize * 1.5);
    } else if (styleId === 'style2') {
        // Stacked on right side
        ctx.textAlign = "right";
        const colX = w - padX;
        const maxW = w * 0.5;
        const dSize = fitted("09", "700", h * 0.16, maxW);
        setFont("700", dSize);
        ctx.fillText("09", colX, h * 0.30);
        ctx.fillText("28", colX, h * 0.50);
        const s2 = Math.max(12, Math.round(dSize * 0.22));
        setFont("500", s2);
        ctx.fillText("SAT 16", colX, h * 0.60);
        ctx.fillText("AM", colX, h * 0.66);
        ctx.textAlign = "center";
    } else if (styleId === 'style3') {
        // Tall digits centered towards top
        const maxW = w - padX * 2;
        const dSize = fitted("09", "300", h * 0.22, maxW);
        setFont("300", dSize);
        ctx.fillText("09", w/2, h * 0.28);
        ctx.fillText("28", w/2, h * 0.53);
        const s3 = Math.max(12, Math.round(dSize * 0.2));
        setFont("500", s3);
        ctx.fillText("AM  SAT  16", w/2, h * 0.72);
    } else if (styleId === 'style4') {
        // Display 4 preview: remove decorative gray circles top/bottom
        const maxW = w - padX * 2;
        const tSize = fitted("0928", "700", h * 0.13, maxW);
        setFont("700", tSize);
        ctx.fillText("0928", w/2, h * 0.5);
        const s4 = Math.max(12, Math.round(tSize * 0.36));
        setFont("bold", s4);
        ctx.fillText("162", w/2, h * 0.15);
        ctx.fillText("2560", w/2, h * 0.85);
    } else if (styleId === 'style5') {
        // Display 5 preview: place time/date near bottom-left like sample
        ctx.textAlign = "left";
        const left = padX + w * 0.10;
        const maxW5 = w - left - padX;
        const timeSize5 = fitted("0928", "700", h * 0.17, maxW5);
        const dateSize5 = Math.max(12, Math.round(timeSize5 * 0.22));
        setFont("500", dateSize5);
        ctx.fillText("AM  SAT  16", left, h * 0.76);
        setFont("700", timeSize5);
        ctx.fillText("0928", left, h * 0.88);
        ctx.textAlign = "center";
    }
    ctx.restore();
}

// --- Main Component ---
export default function CanvasEditor({ template, registerExport }) {
  const { w, h } = template.canvas;
  const [activeTab, setActiveTab] = useState("upload");
  const [previewLayout, setPreviewLayout] = useState(null);
  const [bgColor, setBgColor] = useState("#000000");
  const [viewScale, setViewScale] = useState(1);
  const fitRef = useRef(null);

  const canvasRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [action, setAction] = useState(null); 
  const [activeHandle, setActiveHandle] = useState(null);
  const dragRef = useRef({ startX: 0, startY: 0, layerBefore: null, startPointerWorld: null });

  const [croppingLayerId, setCroppingLayerId] = useState(null);
  const [bgRemovingLayerId, setBgRemovingLayerId] = useState(null);

  const recordHistory = useCallback(() => {
    if (!isLoaded) return;
    const currentState = {
      layers: layers.map(l => { const { image, ...r } = l; return r; }),
      bgColor
    };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(currentState));
      if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [layers, bgColor, historyIndex, isLoaded]);

  useEffect(() => {
    if (isLoaded && history.length === 0) recordHistory();
  }, [isLoaded, history.length, recordHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = JSON.parse(history[prevIndex]);
      setBgColor(state.bgColor);
      const hydrated = state.layers.map(l => (l.type === 'image' && l.src) ? { ...l, image: Object.assign(new Image(), {src: l.src}) } : l);
      setLayers(hydrated);
      setHistoryIndex(prevIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = JSON.parse(history[nextIndex]);
      setBgColor(state.bgColor);
      const hydrated = state.layers.map(l => (l.type === 'image' && l.src) ? { ...l, image: Object.assign(new Image(), {src: l.src}) } : l);
      setLayers(hydrated);
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setLayers(prev => {
        const next = prev.filter(l => l.id !== selectedId);
        setTimeout(recordHistory, 0);
        return next;
      });
      setSelectedId(null);
    }
  }, [selectedId, recordHistory]);

  useEffect(() => {
    const handleKeyDown = (evt) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
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
        const data = JSON.parse(saved);
        if (data.bgColor) setBgColor(data.bgColor);
        if (data.assets) setAssets(data.assets.map(a => ({ ...a, image: Object.assign(new Image(), {src: a.src}) })));
        if (data.layers) setLayers(data.layers.map(l => (l.type === 'image' && l.src) ? { ...l, image: Object.assign(new Image(), {src: l.src}) } : l));
      }
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const state = { layers: layers.map(({image, ...r}) => r), assets: assets.map(({image, ...r}) => r), bgColor };
    try { localStorage.setItem("xiaomi_editor_state", JSON.stringify(state)); } catch (e) {}
  }, [layers, assets, bgColor, isLoaded]);

  // Measure text for selection/resize handles
  const measureTextBox = useCallback((text, fontSize, fontWeight) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    try { ctx.font = `${fontWeight || '700'} ${fontSize || 48}px sans-serif`; } catch (e) {}
    const m = ctx.measureText(text || '');
    const width = Math.max(1, Math.ceil(m.width || (fontSize || 48) * (String(text||'').length * 0.6)));
    const ascent = m.actualBoundingBoxAscent || (fontSize || 48) * 0.8;
    const descent = m.actualBoundingBoxDescent || (fontSize || 48) * 0.25;
    const height = Math.max(1, Math.ceil(ascent + descent));
    return { width, height };
  }, []);

  const addLayer = useCallback((layerProps) => {
    // If text layer, attach width/height so it can be picked/resized like images
    let finalProps = layerProps;
    if (layerProps?.type === 'text' || layerProps?.type === 'clock') {
      const { width, height } = measureTextBox(layerProps.text || '', layerProps.fontSize, layerProps.fontWeight);
      finalProps = { width, height, ...layerProps };
    }
    const newLayer = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      x: w / 2, y: h / 2, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1, locked: false, hidden: false,
      brightness: 100, contrast: 100, saturate: 100, grayscale: 0,
      ...finalProps
    };
    setLayers(prev => { const next = [...prev, newLayer]; setTimeout(recordHistory, 0); return next; });
    setSelectedId(newLayer.id);
  }, [w, h, recordHistory, measureTextBox]);

  const updateLayer = useCallback((id, patch, save = false) => {
    setLayers(prev => {
      const next = prev.map(l => {
        if (l.id !== id) return l;
        let merged = { ...l, ...patch };
        // Keep text layer bbox up-to-date so hit-testing and handles work
        if ((merged.type === 'text' || merged.type === 'clock') && (patch.text !== undefined || patch.fontSize !== undefined || patch.fontWeight !== undefined)) {
          const mb = measureTextBox(merged.text || '', merged.fontSize, merged.fontWeight);
          merged.width = mb.width; merged.height = mb.height;
        }
        return merged;
      });
      if (save) setTimeout(recordHistory, 0);
      return next;
    });
  }, [recordHistory, measureTextBox]);

  const updateSelected = useCallback((patch, save = false) => { if (selectedId) updateLayer(selectedId, patch, save); }, [selectedId, updateLayer]);

  const handleFileUpload = useCallback((files) => {
    Array.from(files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result; const img = new Image();
        img.onload = () => setAssets(prev => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: file.name, image: img, width: img.width, height: img.height, url: src, src: src }]);
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const addImageToCanvas = useCallback((asset) => {
    const contain = Math.max(w / asset.width, h / asset.height);
    addLayer({ type: "image", name: asset.name, width: asset.width, height: asset.height, image: asset.image, src: asset.src, scaleX: contain, scaleY: contain });
  }, [addLayer, w, h]);

  const getPointer = (evt) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = (w + CANVAS_MARGIN * 2) / rect.width;
    const scaleY = (h + CANVAS_MARGIN * 2) / rect.height;
    return { x: (evt.clientX - rect.left) * scaleX - CANVAS_MARGIN, y: (evt.clientY - rect.top) * scaleY - CANVAS_MARGIN };
  };

  const getHandleCoords = (layer) => {
    const cw = layer.crop ? layer.width * layer.crop.w : layer.width;
    const ch = layer.crop ? layer.height * layer.crop.h : layer.height;
    const hw = (cw * layer.scaleX) / 2; const hh = (ch * layer.scaleY) / 2;
    const bounds = { tl: {x:-hw, y:-hh}, t:{x:0, y:-hh}, tr:{x:hw, y:-hh}, r:{x:hw, y:0}, br:{x:hw, y:hh}, b:{x:0, y:hh}, bl:{x:-hw, y:hh}, l:{x:-hw, y:0} };
    const world = {};
    for (const k in bounds) { const r = rotatePoint(bounds[k].x, bounds[k].y, 0, 0, layer.rotation); world[k] = { x: layer.x + r.x, y: layer.y + r.y }; }
    return world;
  };

  const onPointerDown = useCallback((evt) => {
    if (croppingLayerId || bgRemovingLayerId) return;
    const p = getPointer(evt);
    if (selectedId) {
      const L = layers.find(l => l.id === selectedId);
      if (L && !L.locked) {
        const handles = getHandleCoords(L);
        for (const k in handles) {
          if (Math.sqrt((p.x - handles[k].x)**2 + (p.y - handles[k].y)**2) <= 15) {
            setAction("resize"); setActiveHandle(k); dragRef.current = { startX: p.x, startY: p.y, layerBefore: { ...L } }; return;
          }
        }
      }
    }
    let picked = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i]; if (L.hidden || L.locked) continue;
      const loc = pointToLocal(L, p.x, p.y);
      const cw = L.crop ? L.width * L.crop.w : L.width; const ch = L.crop ? L.height * L.crop.h : L.height;
      if (Math.abs(loc.x) <= cw/2 && Math.abs(loc.y) <= ch/2) { picked = L; break; }
    }
    if (picked) { setSelectedId(picked.id); dragRef.current = { startX: p.x, startY: p.y, layerBefore: { ...picked } }; setAction("move"); }
    else { setSelectedId(null); setAction(null); }
  }, [layers, selectedId, croppingLayerId, bgRemovingLayerId, w, h]);

  const onPointerMove = useCallback((evt) => {
    if (croppingLayerId || bgRemovingLayerId || !action || !selectedId) return;
    const p = getPointer(evt);
    const L = layers.find(l => l.id === selectedId); if (!L) return;
    const before = dragRef.current.layerBefore;
    if (action === "move") updateLayer(selectedId, { x: before.x + (p.x - dragRef.current.startX), y: before.y + (p.y - dragRef.current.startY) });
    else if (action === "resize") {
      const sl = unrotatePoint(dragRef.current.startX, dragRef.current.startY, before.x, before.y, before.rotation);
      const cl = unrotatePoint(p.x, p.y, before.x, before.y, before.rotation);
      const dx = cl.x - sl.x; const dy = cl.y - sl.y;
      let dLx = 0, dRx = 0, dTy = 0, dBy = 0;
      if (activeHandle.includes('l')) dLx = dx; if (activeHandle.includes('r')) dRx = dx; if (activeHandle.includes('t')) dTy = dy; if (activeHandle.includes('b')) dBy = dy;
      const cw = before.crop ? before.width * before.crop.w : before.width; const ch = before.crop ? before.height * before.crop.h : before.height;
      if (activeHandle.length === 2) {
        let rw = cw * before.scaleX + (dRx - dLx); let rh = ch * before.scaleY + (dBy - dTy);
        const ratio = (cw * before.scaleX) / (ch * before.scaleY);
        if (Math.abs(rw - cw * before.scaleX) > Math.abs(rh - ch * before.scaleY)) { rh = rw / ratio; if (activeHandle.includes('b')) dBy = rh - ch * before.scaleY; else dTy = -(rh - ch * before.scaleY); }
        else { rw = rh * ratio; if (activeHandle.includes('r')) dRx = rw - cw * before.scaleX; else dLx = -(rw - cw * before.scaleX); }
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
    const ctx = canvas.getContext("2d");
    canvas.width = w + CANVAS_MARGIN * 2; canvas.height = h + CANVAS_MARGIN * 2;
    ctx.save(); ctx.translate(CANVAS_MARGIN, CANVAS_MARGIN);
    const r = getCornerRadiusPx(w, h, template);
    ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, r); ctx.clip(); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h); ctx.restore();
    const drawL = (L) => {
      if (L.hidden) return;
      ctx.save(); ctx.globalAlpha = L.opacity ?? 1; ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation)); ctx.scale(L.scaleX, L.scaleY);
      if (L.type === "image" && L.image) {
        if (ctx.filter !== undefined) ctx.filter = `brightness(${L.brightness ?? 100}%) contrast(${L.contrast ?? 100}%) saturate(${L.saturate ?? 100}%) grayscale(${L.grayscale ?? 0}%)`;
        const cw = L.crop ? L.width * L.crop.w : L.width, ch = L.crop ? L.height * L.crop.h : L.height, cx = L.crop ? L.width * L.crop.x : 0, cy = L.crop ? L.height * L.crop.y : 0;
        ctx.drawImage(L.image, cx, cy, cw, ch, -cw/2, -ch/2, cw, ch); ctx.filter = "none";
      } else if (L.type === "rect") { ctx.fillStyle = L.fill; ctx.fillRect(-L.width/2, -L.height/2, L.width, L.height); }
      else if (L.type === "circle") { ctx.fillStyle = L.fill; ctx.beginPath(); ctx.ellipse(0,0,L.width/2,L.height/2,0,0,Math.PI*2); ctx.fill(); }
      else if (L.type === "text" || L.type === "clock") { ctx.fillStyle = L.color; ctx.font = `${L.fontWeight || "700"} ${L.fontSize || 48}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(L.text, 0, 0); }
      ctx.restore();
    };
    layers.forEach(L => { ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, r); ctx.clip(); drawL(L); ctx.restore(); });
    if (previewLayout) drawLayoutPreview(ctx, w, h, previewLayout);
    ctx.save(); const bT = 16; const bP = new Path2D(); bP.addPath(buildRoundedRectPath(-bT,-bT,w+bT*2,h+bT*2,r+bT)); bP.addPath(buildRoundedRectPath(0,0,w,h,r)); ctx.fillStyle="#111827"; ctx.fill(bP,"evenodd"); ctx.strokeStyle="rgba(255,255,255,0.15)"; ctx.lineWidth=2; ctx.stroke(buildRoundedRectPath(0,0,w,h,r)); ctx.restore();
    if (selectedId && !croppingLayerId && !bgRemovingLayerId) {
      const L = layers.find(l => l.id === selectedId);
      if (L && !L.hidden) {
        ctx.save(); ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation));
        // Compute selection rectangle size accounting for scale
        let cw = L.width * L.scaleX, ch = L.height * L.scaleY;
        if (L.type === 'image' && L.crop) { cw = L.width * (L.crop.w || 1) * L.scaleX; ch = L.height * (L.crop.h || 1) * L.scaleY; }
        ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2; ctx.setLineDash([4, 2]); ctx.strokeRect(-cw / 2, -ch / 2, cw, ch); ctx.restore();
        const handles = getHandleCoords(L); ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2;
        for (const k in handles) { ctx.beginPath(); ctx.arc(handles[k].x, handles[k].y, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
      }
    }
    ctx.restore();
  }, [layers, selectedId, w, h, bgColor, template, croppingLayerId, bgRemovingLayerId, previewLayout]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = fitRef.current;
      setViewScale(Math.max(0.2, Math.min((clientWidth - 120) / w, (clientHeight - 120) / h)));
    });
    ro.observe(fitRef.current); return () => ro.disconnect();
  }, [w, h]);

  useEffect(() => {
    if (registerExport) registerExport((fmt, scale) => {
      const outW = Math.round(w * scale), outH = Math.round(h * scale), off = document.createElement("canvas");
      off.width = outW; off.height = outH; const ctx = off.getContext("2d"); ctx.scale(scale, scale);
      ctx.save(); drawRoundedRectPath(ctx, 0, 0, w, h, getCornerRadiusPx(w, h, template)); ctx.clip(); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);
      layers.forEach(L => {
        if (L.hidden) return;
        ctx.save(); ctx.globalAlpha = L.opacity ?? 1; ctx.translate(L.x, L.y); ctx.rotate(deg2rad(L.rotation)); ctx.scale(L.scaleX, L.scaleY);
        if (L.type === "image" && L.image) {
          if (ctx.filter !== undefined) ctx.filter = `brightness(${L.brightness ?? 100}%) contrast(${L.contrast ?? 100}%) saturate(${L.saturate ?? 100}%) grayscale(${L.grayscale ?? 0}%)`;
          const cw = L.crop ? L.width * L.crop.w : L.width, ch = L.crop ? L.height * L.crop.h : L.height, cx = L.crop ? L.width * L.crop.x : 0, cy = L.crop ? L.height * L.crop.y : 0;
          ctx.drawImage(L.image, cx, cy, cw, ch, -cw/2, -ch/2, cw, ch); ctx.filter = "none";
        } else if (L.type === "rect") { ctx.fillStyle = L.fill; ctx.fillRect(-L.width/2, -L.height/2, L.width, L.height); }
        else if (L.type === "circle") { ctx.fillStyle = L.fill; ctx.beginPath(); ctx.ellipse(0,0,L.width/2,L.height/2,0,0,Math.PI*2); ctx.fill(); }
        else if (L.type === "text" || L.type === "clock") { ctx.fillStyle = L.color; ctx.font = `${L.fontWeight || "700"} ${L.fontSize || 48}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(L.text, 0, 0); }
        ctx.restore();
      });
      ctx.restore();
      const a = document.createElement("a"); a.href = off.toDataURL(fmt === "png" ? "image/png" : "image/jpeg", 0.9); a.download = `watchface.${fmt}`; a.click();
    });
  }, [registerExport, layers, bgColor, w, h, template]);

  const selectedLayer = layers.find(l => l.id === selectedId);
  const [showFilters, setShowFilters] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState(null);
  const [dragOverLayerId, setDragOverLayerId] = useState(null);

  const handleLayerDrop = useCallback((targetId) => {
    setLayers(prev => {
      const view = prev.slice().reverse();
      const fromRev = view.findIndex(l => l.id === draggingLayerId);
      const toRev = view.findIndex(l => l.id === targetId);
      if (fromRev === -1 || toRev === -1 || fromRev === toRev) return prev;
      const from = prev.length - 1 - fromRev;
      const to = prev.length - 1 - toRev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setTimeout(recordHistory, 0);
      return next;
    });
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
          {activeTab === "upload" && (
            <div className="animate-in fade-in duration-300">
              <h2 className="panel-header">画像</h2>
              <div className="mb-6">
                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-violet-300 border-dashed rounded-lg cursor-pointer bg-violet-50 hover:bg-violet-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadIcon className="w-8 h-8 text-violet-500 mb-2" /><p className="text-sm text-violet-700 font-medium">クリックしてアップロード</p></div>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">{assets.map(asset => (<button key={asset.id} onClick={() => addImageToCanvas(asset)} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-violet-500 transition-all"><img src={asset.url} className="w-full h-full object-cover" alt="" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" /></button>))}</div>
            </div>
          )}
          {activeTab === "text" && (
            <div className="animate-in fade-in duration-300">
              <h2 className="panel-header">テキスト追加</h2>
              <div className="space-y-3">
                <button onClick={() => addLayer({ type: 'text', text: '見出しを追加', fontSize: 64, fontWeight: '700', color: '#ffffff' })} className="w-full py-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold text-gray-800 transition-colors">見出しを追加</button>
                <button onClick={() => addLayer({ type: 'text', text: '本文テキスト', fontSize: 32, fontWeight: '400', color: '#ffffff' })} className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-lg text-gray-700 transition-colors">本文テキスト</button>
              </div>
            </div>
          )}
          {activeTab === "elements" && (
            <div className="animate-in fade-in duration-300">
              <h2 className="panel-header">図形</h2>
              <div className="grid grid-cols-3 gap-3"><button onClick={() => addLayer({ type: 'rect', width: 100, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-10 h-10 bg-gray-400 rounded-sm" /></button><button onClick={() => addLayer({ type: 'circle', width: 100, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-10 h-10 bg-gray-400 rounded-full" /></button></div>
            </div>
          )}
          {activeTab === "background" && (
             <div className="animate-in fade-in duration-300">
                <h2 className="panel-header">背景色</h2>
                <div className="space-y-4">
                  <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setTimeout(recordHistory, 0); }} className="w-full h-12 rounded cursor-pointer" />
                  <div className="flex flex-wrap gap-2">{["#000000", "#ffffff", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"].map(c => (<button key={c} onClick={()=>{ setBgColor(c); setTimeout(recordHistory, 0); }} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{backgroundColor: c}} />))}</div>
                </div>
             </div>
          )}
          {activeTab === "layout" && (
             <div className="animate-in fade-in duration-300">
                <h2 className="panel-header">プレビュー</h2>
                <p className="text-xs text-gray-500 mb-3">実際の時刻表示イメージを確認できます。この文字は画像には書き出されません。</p>
                <div className="grid grid-cols-2 gap-3">
                  {LAYOUT_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setPreviewLayout(style.id === 'none' ? null : style.id)}
                      className={`p-3 rounded-lg border text-center text-sm flex flex-col items-center ${previewLayout === style.id || (style.id==='none' && !previewLayout) ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      <div className="w-20">{/* thumbnail */}
                        <LayoutPreviewThumb styleId={style.id} template={template} />
                      </div>
                      <div className="mt-2 w-24 whitespace-nowrap text-xs">{style.label}</div>
                    </button>
                  ))}
                </div>
             </div>
          )}
          {activeTab === "layers" && (
             <div className="animate-in fade-in duration-300">
                <h2 className="panel-header">レイヤー</h2>
                <div className="space-y-2">
                    {layers.slice().reverse().map(layer => (
                        <div
                          key={layer.id}
                          draggable
                          onDragStart={(e)=>{ setDraggingLayerId(layer.id); e.dataTransfer.effectAllowed='move'; }}
                          onDragOver={(e)=>{ e.preventDefault(); setDragOverLayerId(layer.id); }}
                          onDragLeave={()=>{ setDragOverLayerId(null); }}
                          onDrop={(e)=>{ e.preventDefault(); handleLayerDrop(layer.id); }}
                          className={`flex items-center gap-2 p-2 rounded border cursor-move select-none ${selectedId === layer.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'} ${dragOverLayerId===layer.id ? 'ring-2 ring-violet-400' : ''}`}
                          onClick={()=>setSelectedId(layer.id)}
                        >
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center shrink-0 text-xs overflow-hidden">
                                {layer.type === 'image' && layer.src && <img src={layer.src} className="w-full h-full object-cover" alt="" />}
                                {layer.type === 'text' && 'T'}
                                {layer.type === 'clock' && '🕒'}
                                {layer.type === 'rect' && '⬛'}
                                {layer.type === 'circle' && '●'}
                            </div>
                            <div className="text-sm truncate flex-1">{layer.name || layer.type}</div>
                            <button className="text-gray-500 hover:text-gray-900" onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { hidden: !layer.hidden }, true); }}>{layer.hidden ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                            <button className="text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setLayers(prev=>prev.filter(l=>l.id!==layer.id)); setTimeout(recordHistory,0); if(selectedId === layer.id) setSelectedId(null); }}><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {layers.length === 0 && <div className="text-sm text-gray-400 text-center py-4">レイヤーがありません</div>}
                </div>
             </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0 overflow-x-auto thin-scrollbar">
          {selectedLayer && (
            <div className="flex items-center gap-4 animate-in fade-in duration-200 w-full">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">{selectedLayer.type}</div>
              <div className="h-6 w-px bg-gray-200 shrink-0" />
              {selectedLayer.type === 'image' && (
                <>
                  <button onClick={() => setCroppingLayerId(selectedLayer.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><ScissorsIcon className="w-4 h-4" /><span>トリミング</span></button>
                  <button onClick={() => setBgRemovingLayerId(selectedLayer.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><MagicWandIcon className="w-4 h-4" /><span>背景透過</span></button>
                  <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showFilters ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><PaletteIcon className="w-4 h-4" /><span>色調整</span></button>
                  {showFilters && (
                    <div className="absolute top-12 left-64 bg-white shadow-xl border border-gray-200 rounded-lg p-4 z-50 flex flex-col gap-3 min-w-[200px]">
                        {['brightness','contrast','saturate'].map(f => (<div key={f}><div className="flex justify-between text-xs text-gray-500 mb-1"><span className="capitalize">{f}</span><span>{selectedLayer[f]||100}%</span></div><input type="range" min="0" max="200" value={selectedLayer[f]||100} onChange={(e)=>updateSelected({[f]: parseInt(e.target.value)}, true)} className="w-full accent-violet-600" /></div>))}
                        <div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Grayscale</span><span>{selectedLayer.grayscale||0}%</span></div><input type="range" min="0" max="100" value={selectedLayer.grayscale||0} onChange={(e)=>updateSelected({grayscale: parseInt(e.target.value)}, true)} className="w-full accent-violet-600" /></div>
                    </div>
                  )}
                </>
              )}
              {(selectedLayer.type === 'text' || selectedLayer.type === 'clock') && (
                <>
                  <input type="color" value={selectedLayer.color || '#ffffff'} onChange={(e)=>updateSelected({color: e.target.value}, true)} className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5" />
                  <div className="flex items-center bg-gray-100 rounded-md px-2 py-1"><span className="text-[10px] text-gray-500 font-bold mr-2">SIZE</span><input type="number" value={selectedLayer.fontSize || 48} onChange={(e)=>updateSelected({fontSize: parseInt(e.target.value)}, true)} className="w-12 bg-transparent text-sm font-medium focus:outline-none" /><span className="text-[10px] text-gray-400 ml-1">px</span></div>
                  <select value={selectedLayer.fontWeight || "700"} onChange={(e)=>updateSelected({fontWeight: e.target.value}, true)} className="bg-gray-100 rounded-md px-2 py-1 text-sm font-medium focus:outline-none border-none cursor-pointer"><option value="400">Regular</option><option value="700">Bold</option><option value="900">Black</option></select>
                  {selectedLayer.type === 'text' && <input type="text" value={selectedLayer.text || ''} onChange={(e)=>updateSelected({text: e.target.value}, true)} className="bg-gray-100 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-violet-500 outline-none w-40" placeholder="テキスト..." />}
                </>
              )}
              <div className="h-6 w-px bg-gray-200 shrink-0" />
              <div className="flex items-center gap-2 shrink-0"><input type="range" min="0" max="1" step="0.1" value={selectedLayer.opacity ?? 1} onChange={(e) => updateSelected({ opacity: parseFloat(e.target.value) }, true)} className="w-20 accent-violet-600 h-1.5" /></div>
              <button onClick={()=>updateSelected({hidden: !selectedLayer.hidden}, true)} className={`p-1.5 rounded ${selectedLayer.hidden ? 'bg-red-50 text-red-500' : 'hover:bg-gray-100 text-gray-600'}`}>{selectedLayer.hidden ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
              <div className="flex items-center gap-1 ml-auto border-l border-gray-200 pl-4 shrink-0"><button onClick={() => moveLayerOrder('up')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><LayersIcon className="w-4 h-4" /></button><button onClick={() => moveLayerOrder('down')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><LayersIcon className="w-4 h-4 rotate-180" /></button><button onClick={deleteSelected} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><TrashIcon className="w-4 h-4" /></button></div>
            </div>
          )}
        </div>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8" ref={fitRef}>
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           <div className="relative">
             <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} className="relative touch-none cursor-grab active:cursor-grabbing" style={{ width: (w + CANVAS_MARGIN*2) * viewScale, height: (h + CANVAS_MARGIN*2) * viewScale, background: 'transparent' }} />
           </div>
            <div className="absolute bottom-6 right-6 bg-white rounded-full shadow-lg border border-gray-100 p-1 flex items-center gap-2"><button onClick={() => setViewScale(s => Math.max(0.1, s - 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-600">-</button><span className="text-xs font-medium w-12 text-center text-gray-500">{Math.round(viewScale * 100)}%</span><button onClick={() => setViewScale(s => Math.min(3, s + 0.1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-600">+</button></div>
            <div className="absolute bottom-6 left-6 flex gap-2"><button onClick={undo} disabled={historyIndex <= 0} className="p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 disabled:opacity-50 hover:bg-gray-50"><UndoIcon className="w-5 h-5" /></button><button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 disabled:opacity-50 hover:bg-gray-50"><RedoIcon className="w-5 h-5" /></button></div>
        </div>
      </main>

      {croppingLayerId && layers.find(l=>l.id===croppingLayerId) && ( <CropModal layer={layers.find(l=>l.id===croppingLayerId)} onClose={()=>setCroppingLayerId(null)} onSave={(newCrop) => { updateLayer(croppingLayerId, { crop: newCrop }, true); setCroppingLayerId(null); }} /> )}
      {bgRemovingLayerId && layers.find(l=>l.id===bgRemovingLayerId) && ( <RemoveBgModal layer={layers.find(l=>l.id===bgRemovingLayerId)} onClose={()=>setBgRemovingLayerId(null)} onSave={(newImg, newUrl) => { updateLayer(bgRemovingLayerId, { image: newImg, src: newUrl }, true); setBgRemovingLayerId(null); }} /> )}
    </div>
  );
}

// Small thumbnail renderer for the layout list
function LayoutPreviewThumb({ styleId, template }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ratio = template.canvas.h / template.canvas.w;
    const W = 80; const H = Math.round(W * ratio);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const r = getCornerRadiusPx(W, H, template);
    // Outer ring
    ctx.save();
    drawRoundedRectPath(ctx, 0, 0, W, H, r);
    ctx.fillStyle = '#0b0f17';
    ctx.fill();
    ctx.restore();
    // Inner bevel ring
    ctx.save();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    drawRoundedRectPath(ctx, 2, 2, W-4, H-4, Math.max(0, r-2));
    ctx.stroke();
    ctx.restore();
    if (styleId && styleId !== 'none') {
      drawLayoutPreview(ctx, W, H, styleId);
    }
  }, [styleId, template]);
  return (<canvas ref={ref} className="w-full h-auto block" />);
}

function CropModal({ layer, onClose, onSave }) {
    const [crop, setCrop] = useState(layer.crop || { x: 0, y: 0, w: 1, h: 1 });
    const containerRef = useRef(null); const [dragging, setDragging] = useState(null);
    const handleMouseMove = (evt) => {
        if (!dragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width)), cy = Math.max(0, Math.min(1, (evt.clientY - rect.top) / rect.height));
        if (dragging === 'br') setCrop(p => ({ ...p, w: Math.max(0.05, cx - p.x), h: Math.max(0.05, cy - p.y) }));
        else if (dragging === 'tl') { const nx = Math.min(cx, crop.x + crop.w - 0.05), ny = Math.min(cy, crop.y + crop.h - 0.05); setCrop(p => ({ ...p, x: nx, y: ny, w: p.w + (p.x - nx), h: p.h + (p.y - ny) })); }
    };
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onMouseMove={handleMouseMove} onMouseUp={()=>setDragging(null)}>
            <div className="bg-white rounded-lg p-4 max-w-4xl w-full flex flex-col h-[80vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">トリミング編集</h3><div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">キャンセル</button><button onClick={()=>onSave(crop)} className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">適用</button></div></div>
                <div className="flex-1 relative bg-gray-100 rounded overflow-hidden flex items-center justify-center select-none"><div className="relative" ref={containerRef}><img src={layer.src} className="max-h-[60vh] max-w-full object-contain block pointer-events-none" alt="" /><div className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }} onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDragging('move');}}><div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-violet-500 cursor-nw-resize" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDragging('tl');}} /><div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-violet-500 cursor-se-resize" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDragging('br');}} /></div></div></div>
            </div>
        </div>
    );
}

function RemoveBgModal({ layer, onClose, onSave }) {
    const [mode, setMode] = useState('color'); const [brushType, setBrushType] = useState('erase'); const [color, setColor] = useState("#ffffff"); const [tolerance, setTolerance] = useState(20); const [brushSize, setBrushSize] = useState(30);
    const canvasRef = useRef(null); const [isDrawing, setIsDrawing] = useState(false); const workingCanvasRef = useRef(null); const originalCanvasRef = useRef(null);
    useEffect(() => {
        const w = layer.image.width, h = layer.image.height;
        const wc = document.createElement('canvas'); wc.width = w; wc.height = h; wc.getContext('2d').drawImage(layer.image, 0, 0); workingCanvasRef.current = wc;
        const oc = document.createElement('canvas'); oc.width = w; oc.height = h; oc.getContext('2d').drawImage(layer.image, 0, 0); originalCanvasRef.current = oc;
        updateP();
    }, [layer]);
    const updateP = () => { const c = canvasRef.current, wc = workingCanvasRef.current; if (!c || !wc) return; c.width = wc.width; c.height = wc.height; const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); ctx.drawImage(wc, 0, 0); };
    const getPos = (e) => { const c = canvasRef.current; const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }; };
    const dBrush = (pos) => {
        if (!workingCanvasRef.current) return; const ctx = workingCanvasRef.current.getContext('2d'); const r = brushSize / 2;
        if (brushType === 'restore') { ctx.save(); ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.clip(); ctx.clearRect(pos.x-r, pos.y-r, r*2, r*2); ctx.drawImage(originalCanvasRef.current, 0, 0); ctx.restore(); }
        else {
            const imgData = ctx.getImageData(pos.x-r, pos.y-r, r*2, r*2); const data = imgData.data; const rT = parseInt(color.slice(1,3),16), gT = parseInt(color.slice(3,5),16), bT = parseInt(color.slice(5,7),16), tol = tolerance * 2.55;
            for (let i=0; i<data.length; i+=4) { if (Math.sqrt((data[i]-rT)**2 + (data[i+1]-gT)**2 + (data[i+2]-bT)**2) <= tol) data[i+3]=0; }
            ctx.putImageData(imgData, pos.x-r, pos.y-r);
        }
        updateP();
    };
    const handleSave = () => { const url = workingCanvasRef.current.toDataURL("image/png"); const img = new Image(); img.onload = () => onSave(img, url); img.src = url; };
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onMouseUp={()=>setIsDrawing(false)}>
            <div className="bg-white rounded-lg p-4 max-w-5xl w-full flex flex-col h-[85vh]">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">背景透過</h3><div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">キャンセル</button><button onClick={handleSave} className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">適用</button></div></div>
                <div className="flex gap-4 flex-1 overflow-hidden">
                    <div className="w-64 flex flex-col gap-6 p-4 bg-gray-50 rounded h-full shrink-0">
                        <div className="flex rounded bg-white border border-gray-200 p-1"><button onClick={()=>setMode('color')} className={`flex-1 py-1.5 text-sm rounded ${mode==='color'?'bg-indigo-100 text-indigo-700 font-bold':''}`}>自動</button><button onClick={()=>setMode('brush')} className={`flex-1 py-1.5 text-sm rounded ${mode==='brush'?'bg-indigo-100 text-indigo-700 font-bold':''}`}>ブラシ</button></div>
                        {mode === 'color' ? ( <div className="space-y-4"><div><label className="text-xs font-bold block mb-1">除去色</label><input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="w-full h-10 rounded border cursor-pointer" /></div><input type="range" min="1" max="100" value={tolerance} onChange={(e)=>setTolerance(parseInt(e.target.value))} className="w-full" /><button onClick={()=>{processRemoveColor(workingCanvasRef.current, color, tolerance); updateP();}} className="w-full py-2 bg-indigo-600 text-white rounded">一括除去</button></div> ) : (
                            <div className="space-y-4"><div className="flex rounded bg-white border border-gray-200 p-1"><button onClick={()=>setBrushType('erase')} className={`flex-1 py-1.5 text-sm rounded ${brushType==='erase'?'bg-red-100 text-red-700 font-bold':''}`}>消す</button><button onClick={()=>setBrushType('restore')} className={`flex-1 py-1.5 text-sm rounded ${brushType==='restore'?'bg-green-100 text-green-700 font-bold':''}`}>戻す</button></div><input type="range" min="5" max="100" value={brushSize} onChange={(e)=>setBrushSize(parseInt(e.target.value))} className="w-full" />{brushType==='erase' && <input type="range" min="1" max="100" value={tolerance} onChange={(e)=>setTolerance(parseInt(e.target.value))} className="w-full" />}</div>
                        )}
                    </div>
                    <div className="flex-1 bg-[url('https://transparent-textures.sourceforge.io/patterns/diagmonds-light.png')] bg-gray-200 rounded flex items-center justify-center overflow-auto border"><canvas ref={canvasRef} onMouseDown={(e)=>{setIsDrawing(true); dBrush(getPos(e));}} onMouseMove={(e)=>{if(isDrawing) dBrush(getPos(e));}} className="max-w-full max-h-full object-contain shadow-lg" /></div>
                </div>
            </div>
        </div>
    );
}
