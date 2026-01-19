import type { Template } from "./templates";
import type { Layer, ImageLayer, TextLayer } from "./types";

export function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function buildRoundedRectPath(x: number, y: number, w: number, h: number, r: number) {
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

export function getCornerRadiusPx(w: number, h: number, template: Template) {
  const t = template.cornerRadius;
  if (t === "pill") return Math.min(w, h) / 2;
  if (typeof t === "number") return Math.min(t, w / 2, h / 2);
  return Math.min(w, h) * 0.16;
}

export const deg2rad = (d: number) => (d * Math.PI) / 180;
export const rad2deg = (r: number) => (r * 180) / Math.PI;

export const rotatePoint = (x: number, y: number, cx: number, cy: number, angleDeg: number) => {
  const rad = deg2rad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

export const unrotatePoint = (x: number, y: number, cx: number, cy: number, angleDeg: number) => rotatePoint(x, y, cx, cy, -angleDeg);

// Measure text bounding box for given font settings
export function measureTextBox(text: string, fontSize: number = 48, fontWeight: string = '700', fontFamily: string = 'sans-serif') {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  try { ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`; } catch (_) {}
  const m = ctx.measureText(text || '');
  const width = Math.max(1, Math.ceil(m.width || fontSize * (String(text||'').length * 0.6)));
  const ascent = m.actualBoundingBoxAscent ?? fontSize * 0.8;
  const descent = m.actualBoundingBoxDescent ?? fontSize * 0.25;
  const height = Math.max(1, Math.ceil(ascent + descent));
  return { width, height };
}

// Preview renderer used for thumbnails and on-canvas guide
export function drawLayoutPreview(ctx: CanvasRenderingContext2D, w: number, h: number, styleId: string | null) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;

  const padX = w * 0.08;
  const padY = h * 0.06;
  const setFont = (weight: string, size: number) => { ctx.font = `${weight} ${Math.round(size)}px sans-serif`; };
  const fitted = (text: string, weight: string, basePx: number, maxWidth: number) => {
    let size = basePx; setFont(weight, size);
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return size;
    size = Math.max(8, Math.floor(basePx * (maxWidth / Math.max(1, width))));
    setFont(weight, size);
    return size;
  };

  const date = "AM SAT 16";

  if (styleId === 'style1') {
    const maxW = w - padX * 2;
    
    // 1. Status Bar (Bluetooth & Battery) - Fine-tuned position and size
    const statusSize = Math.round(w * 0.08); 
    const statusY = h * 0.155; // Slightly lower (from 0.15)
    setFont("400", statusSize);
    
    // Bluetooth Icon (Slightly smaller and moved right)
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    const btX = w/2 - statusSize * 1.0; // Moved right (from -1.3)
    const btY = statusY;
    const btH = statusSize * 0.65; // Smaller (from 0.8)
    ctx.beginPath();
    ctx.moveTo(btX - btH/2, btY - btH/2);
    ctx.lineTo(btX + btH/2, btY + btH/2);
    ctx.lineTo(btX, btY + btH);
    ctx.lineTo(btX, btY - btH);
    ctx.lineTo(btX + btH/2, btY - btH/2);
    ctx.lineTo(btX - btH/2, btY + btH/2);
    ctx.stroke();
    ctx.restore();

    // Battery Icon & Text (Moved right)
    ctx.textAlign = "left";
    const battX = w/2 + statusSize * 0.7; // Moved right (from 0.4)
    const battW = statusSize * 1.2;
    const battH = statusSize * 0.6;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(battX, statusY - battH/2, battW, battH);
    ctx.fillRect(battX + battW, statusY - battH/4, 2, battH/2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(battX + 1.5, statusY - battH/2 + 1.5, battW * 0.7, battH - 3);
    ctx.fillText("80%", battX + battW + 5, statusY + 1);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";

    // 2. Time (09 outlined, 28 solid) - Moved up slightly
    const timeY = h * 0.27; // Moved up slightly from 0.28
    let timeSize = h * 0.11; 
    
    const hStr = "09";
    const mStr = "28";
    setFont("700", timeSize);
    const hW = ctx.measureText(hStr).width;
    const mW = ctx.measureText(mStr).width;
    const spacing = timeSize * 0.12;
    
    ctx.save();
    ctx.translate(w/2, timeY);
    ctx.scale(0.9, 1.3); 
    
    // Hour (Outline)
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(hStr, -(hW + mW + spacing)/2 + hW/2, 0);
    ctx.restore();
    
    // Minute (Solid)
    ctx.fillText(mStr, (hW + mW + spacing)/2 - mW/2, 0);
    ctx.restore();

    // 3. Date (AM SAT 16) - Bolder and wider spacing
    const dateSize = timeSize * 0.38;
    const dateY = timeY + timeSize * 0.92; 
    
    ctx.save();
    ctx.translate(w/2, dateY);
    ctx.scale(0.9, 1.3);
    setFont("600", dateSize); // Bolder (600)
    ctx.fillText("AM  SAT  16", 0, 0); // Double spaces for wider gap
    ctx.restore();

  } else if (styleId === 'style2') {
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
    const maxW = w - padX * 2;
    const dSize = fitted("09", "300", h * 0.22, maxW);
    setFont("300", dSize);
    ctx.fillText("09", w/2, h * 0.28);
    ctx.fillText("28", w/2, h * 0.53);
    const s3 = Math.max(12, Math.round(dSize * 0.2));
    setFont("500", s3);
    ctx.fillText("AM  SAT  16", w/2, h * 0.72);
  } else if (styleId === 'style4') {
    const maxW = w - padX * 2;
    const tSize = fitted("0928", "700", h * 0.13, maxW);
    setFont("700", tSize);
    ctx.fillText("0928", w/2, h * 0.5);
    const s4 = Math.max(12, Math.round(tSize * 0.36));
    setFont("bold", s4);
    ctx.fillText("162", w/2, h * 0.15);
    ctx.fillText("2560", w/2, h * 0.85);
  } else if (styleId === 'style5') {
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

// Convert world coordinates (x,y) to the local, unscaled/unrotated coords of a layer
export function pointToLocal(L: Layer, x: number, y: number) {
  const dx = x - L.x;
  const dy = y - L.y;
  const r = unrotatePoint(dx, dy, 0, 0, L.rotation);
  const sx = L.scaleX || 1;
  const sy = L.scaleY || 1;
  return { x: r.x / sx, y: r.y / sy };
}

// Content size without scale (and taking crop for images)
export function contentSize(L: Layer) {
  if (L.type === 'image' && L.crop) {
    const c = L.crop;
    return { w: (L.width || 0) * c.w, h: (L.height || 0) * c.h };
  }
  return { w: L.width || 0, h: L.height || 0 };
}

// Size of the selection box in world space (includes scale and crop)
export function selectionSize(L: Layer) {
  const c = contentSize(L);
  const sx = L.scaleX || 1;
  const sy = L.scaleY || 1;
  return { w: Math.max(1, c.w * sx), h: Math.max(1, c.h * sy) };
}

// Apply shadow/stroke settings to context
export function applyDecorations(ctx: CanvasRenderingContext2D, L: Layer) {
  if (L.shadow?.enabled) {
    ctx.shadowColor = L.shadow.color;
    ctx.shadowBlur = L.shadow.blur;
    ctx.shadowOffsetX = L.shadow.offsetX;
    ctx.shadowOffsetY = L.shadow.offsetY;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
}

export function drawText(ctx: CanvasRenderingContext2D, L: TextLayer) {
  const { text = '', fontSize = 48, fontWeight = '700', fontFamily = 'sans-serif', color = '#ffffff', curve } = L;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (curve?.enabled && curve.radius !== 0) {
    const chars = text.split('');
    const anglePerChar = (fontSize * (1 + curve.spacing / 100)) / curve.radius;
    const totalAngle = anglePerChar * (chars.length - 1);
    
    ctx.save();
    // Move to center of curve
    ctx.translate(0, curve.radius);
    ctx.rotate(-totalAngle / 2);

    chars.forEach((char, i) => {
      ctx.save();
      ctx.translate(0, -curve.radius);
      
      // Draw Stroke
      if (L.stroke?.enabled) {
        ctx.strokeStyle = L.stroke.color;
        ctx.lineWidth = L.stroke.width;
        ctx.strokeText(char, 0, 0);
      }
      // Draw Fill
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
      ctx.rotate(anglePerChar);
    });
    ctx.restore();
  } else {
    // Standard Draw
    if (L.stroke?.enabled) {
      ctx.strokeStyle = L.stroke.color;
      ctx.lineWidth = L.stroke.width;
      ctx.strokeText(text, 0, 0);
    }
    ctx.fillText(text, 0, 0);
  }
}

export type HandleKey = 'tl'|'t'|'tr'|'r'|'br'|'b'|'bl'|'l'|'rot';
export function getHandleCoords(L: Layer) {
  const sz = selectionSize(L);
  const hw = sz.w / 2, hh = sz.h / 2;
  const rotDist = 30; // Handle distance for rotation
  const bounds: Record<HandleKey, {x:number;y:number}> = {
    tl: {x:-hw, y:-hh}, t:{x:0, y:-hh}, tr:{x:hw, y:-hh}, r:{x:hw, y:0},
    br:{x:hw, y:hh}, b:{x:0, y:hh}, bl:{x:-hw, y:hh}, l:{x:-hw, y:0},
    rot: {x:0, y:-hh - rotDist}
  };
  const world = {} as Record<HandleKey, {x:number;y:number}>;
  (Object.keys(bounds) as HandleKey[]).forEach((k) => {
    const r = rotatePoint(bounds[k].x, bounds[k].y, 0, 0, L.rotation);
    world[k] = { x: L.x + r.x, y: L.y + r.y };
  });
  return world;
}
