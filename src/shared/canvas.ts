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

    // Battery Icon & Text (Vertical)
    const battX = w/2 + statusSize * 0.7; 
    const battW = statusSize * 0.6;
    const battH = statusSize * 0.9;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(battX, statusY - battH/2, battW, battH);
    ctx.fillRect(battX + 2, statusY - battH/2 - 2, battW - 4, 2); 
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(battX + 1.5, statusY + battH/2 - (battH * 0.7), battW - 3, battH * 0.7 - 1.5); 
    ctx.textAlign = "left";
    ctx.fillText("80%", battX + battW + 6, statusY + 2);
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
    // 1. Status Bar (Same as style1)
    const statusSize = Math.round(w * 0.08); 
    const statusY = h * 0.155; 
    setFont("400", statusSize);
    
    // Bluetooth Icon
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    const btX = w/2 - statusSize * 1.0;
    const btY = statusY;
    const btH = statusSize * 0.65;
    ctx.beginPath();
    ctx.moveTo(btX - btH/2, btY - btH/2);
    ctx.lineTo(btX + btH/2, btY + btH/2);
    ctx.lineTo(btX, btY + btH);
    ctx.lineTo(btX, btY - btH);
    ctx.lineTo(btX + btH/2, btY - btH/2);
    ctx.lineTo(btX - btH/2, btY + btH/2);
    ctx.stroke();
    ctx.restore();

    // Battery Icon & Text (Vertical)
    const battX = w/2 + statusSize * 0.7;
    const battW = statusSize * 0.6;
    const battH = statusSize * 0.9;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(battX, statusY - battH/2, battW, battH);
    ctx.fillRect(battX + 2, statusY - battH/2 - 2, battW - 4, 2); 
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(battX + 1.5, statusY + battH/2 - (battH * 0.7), battW - 3, battH * 0.7 - 1.5); 
    ctx.textAlign = "left";
    ctx.fillText("80%", battX + battW + 6, statusY + 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";

    // 2. Vertical Time & Vertical Date
    const timeY = h * 0.35; 
    const timeSize = h * 0.14;
    const dateSize = timeSize * 0.30; // Reduced approx 1px more
    
    const hStr = "09";
    const mStr = "28";
    
    ctx.save();
    // Shift right (+20) and vertical position
    ctx.translate(w/2 + 20, timeY);
    ctx.scale(0.9, 1.3);
    
    // Time (Left part)
    setFont("700", timeSize);
    ctx.textAlign = "right";
    const timeGap = timeSize * 0.85; 
    ctx.fillText(hStr, 0, -timeGap/2);
    ctx.fillText(mStr, 0, timeGap/2);
    
    // Date (Right part) - Right aligned and fine-tuned position
    setFont("600", dateSize);
    ctx.textAlign = "right"; 
    const dateX = 57; // Shifted slightly right (from 55)
    const dateLineH = dateSize * 1.3; 
    const dateUpOffset = -timeSize * 0.31; // Lowered slightly (from -0.35)
    ctx.fillText("SAT", dateX, -dateLineH + dateUpOffset);
    ctx.fillText("16", dateX, 0 + dateUpOffset);
    ctx.fillText("AM", dateX, dateLineH + dateUpOffset);
    
    ctx.restore();
  } else if (styleId === 'style3') {
    // 1. Status Bar (Top Right Edge - Further Up and Right)
    const statusSize = Math.round(w * 0.07);
    
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    
    // Battery (Even further Up and Left)
    const battW = statusSize * 0.6;
    const battH = statusSize * 0.9;
    const battX = w/2 + 15; 
    const battY = h * 0.025; // Further up
    
    ctx.strokeRect(battX, battY, battW, battH);
    ctx.fillRect(battX + 2, battY - 2, battW - 4, 2); 
    ctx.fillRect(battX + 2, battY + battH - (battH * 0.7), battW - 4, battH * 0.7 - 2); 

    // Bluetooth Icon (Further right, Lower than Battery)
    const btX = battX + battW + 14; 
    const btY = battY + 11; // Kept lower but moved up with battery
    const btH = statusSize * 0.7;
    
    ctx.save();
    ctx.translate(btX, btY);
    ctx.beginPath();
    ctx.moveTo(0, -btH/2);
    ctx.lineTo(btH/3, 0);
    ctx.lineTo(0, btH/2);
    ctx.lineTo(0, -btH/2);
    ctx.moveTo(0, 0);
    ctx.lineTo(-btH/3, -btH/3);
    ctx.moveTo(0, 0);
    ctx.lineTo(-btH/3, btH/3);
    ctx.stroke();
    ctx.restore();
    
    ctx.restore();

    // 2. Vertical Time (Solid Thin, Smaller, Centered) - Horizontal Gaps added
    const timeY = h * 0.33; 
    const timeSize = h * 0.18; 
    
    ctx.save();
    ctx.translate(w/2, timeY);
    ctx.scale(0.8, 1.1); 
    
    // Solid Thin Text
    ctx.font = `300 ${timeSize}px sans-serif`; 
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    
    // Draw each digit separately to increase horizontal spacing
    const hGap = timeSize * 0.45; // Increased gap further (from 0.35)
    // 09
    ctx.fillText("0", -hGap, -timeSize * 0.48);
    ctx.fillText("9", hGap, -timeSize * 0.48);
    // 28
    ctx.fillText("2", -hGap, timeSize * 0.56);
    ctx.fillText("8", hGap, timeSize * 0.56);
    
    ctx.restore();

    // 3. Date (Bottom Center) - Lowered slightly
    const dateY = h * 0.88; // Lowered from 0.85
    const dateSize = h * 0.045; 
    
    ctx.save();
    ctx.translate(w/2, dateY);
    ctx.scale(0.9, 1.3);
    setFont("600", dateSize);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("AM  SAT  16", 0, 0);
    ctx.restore();

  } else if (styleId === 'style4') {
    // 1. Top Arc (Calories) - Slightly away from edge, even longer
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 6; 
    ctx.lineCap = "round";
    
    const arcR = w/2 - 12; // Moved away from edge (from -8)
    const cornerR = w/2;
    const topCy = cornerR; 
    
    ctx.beginPath();
    // Extended angles (approx -185 to 5 degrees)
    ctx.arc(w/2, topCy, arcR, Math.PI * 1.02, Math.PI * 1.98); 
    ctx.stroke();

    // Flame Icon (Moved up)
    const flameY = h * 0.08;
    const flameSize = w * 0.04;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(w/2, flameY - flameSize);
    ctx.bezierCurveTo(w/2 + flameSize, flameY, w/2 + flameSize, flameY + flameSize, w/2, flameY + flameSize);
    ctx.bezierCurveTo(w/2 - flameSize, flameY + flameSize, w/2 - flameSize, flameY, w/2, flameY - flameSize);
    ctx.fill();
    
    // Calories Text
    setFont("700", h * 0.055);
    ctx.fillText("162", w/2, h * 0.14);
    ctx.restore();

    // 2. Bottom Arc (Steps) - Slightly away from edge, even longer
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    
    const botCy = h - cornerR;
    ctx.beginPath();
    // Extended angles
    ctx.arc(w/2, botCy, arcR, Math.PI * 0.02, Math.PI * 0.98);
    ctx.stroke();

    // Steps Text (Moved down)
    setFont("700", h * 0.055);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("2560", w/2, h * 0.86);

    // Footsteps Icon (Larger)
    const feetY = h * 0.92;
    const footW = w * 0.02; 
    const footH = w * 0.04; 
    ctx.beginPath(); ctx.ellipse(w/2 - 9, feetY, footW, footH, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w/2 + 9, feetY, footW, footH, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // 3. Center Cluster (Date, Time, Status) - Moved Up
    const centerY = h * 0.48; 
    
    // Date (AM SAT 16) - Slightly smaller & moved closer to time
    setFont("500", h * 0.045);
    ctx.fillText("AM  SAT  16", w/2, centerY - h * 0.06); 

    // Time (0928) - Slightly smaller & moved closer to date
    setFont("500", h * 0.12); 
    ctx.fillText("0928", w/2, centerY + h * 0.03); 

    // Status Bar (Bluetooth & Battery) - Even Larger Icons
    const statusY = centerY + h * 0.11;
    const statusSize = w * 0.08; // Increased significantly (from 0.065)
    
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.6;
    
    // Bluetooth
    const btX = w/2 - 5; // Shifted left (from +5)
    const btH = statusSize * 0.8;
    ctx.save();
    ctx.translate(btX, statusY);
    ctx.beginPath();
    ctx.moveTo(0, -btH/2);
    ctx.lineTo(btH/3, 0);
    ctx.lineTo(0, btH/2);
    ctx.lineTo(0, -btH/2);
    ctx.moveTo(0, 0);
    ctx.lineTo(-btH/3, -btH/3);
    ctx.moveTo(0, 0);
    ctx.lineTo(-btH/3, btH/3);
    ctx.stroke();
    ctx.restore();

    // Battery (Vertical Icon)
    const battX = w/2 + 28; // Shifted left (from +38)
    const battW = statusSize * 0.6;
    const battH = statusSize * 0.9;
    
    ctx.strokeRect(battX, statusY - battH/2, battW, battH);
    ctx.fillRect(battX + 2, statusY - battH/2 - 2, battW - 4, 2); 
    ctx.fillRect(battX + 1.5, statusY + battH/2 - (battH * 0.7), battW - 3, battH * 0.7 - 1.5); 
    
    setFont("400", statusSize * 0.8);
    ctx.textAlign = "left";
    ctx.fillText("80%", battX + battW + 6, statusY + 2);
    ctx.restore();

  } else if (styleId === 'style5') {
    // Bottom Cluster - Moved down
    const centerY = h * 0.78; // Lowered from 0.75
    
    // 1. Date (AM SAT 16) - Moved up to create gap
    setFont("500", h * 0.045);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("AM  SAT  16", w/2, centerY - h * 0.07); // Offset increased from -0.04 to -0.07

    // 2. Time (0928) - Lowered slightly with centerY
    setFont("500", h * 0.12); 
    ctx.fillText("0928", w/2, centerY + h * 0.03);

    // 3. Status Bar (Bluetooth & Battery) - Larger Icons
    const statusY = centerY + h * 0.11;
    const statusSize = w * 0.08; // Increased from 0.065
    
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.6; // Bolder
    
    // Bluetooth
    const btX = w/2 - 15; // Shifted slightly left to balance larger battery
    const btH = statusSize * 0.8;
    ctx.save();
    ctx.translate(btX, statusY);
    ctx.beginPath();
    ctx.moveTo(0, -btH/2);
    ctx.lineTo(btH/3, 0);
    ctx.lineTo(0, btH/2);
    ctx.lineTo(0, -btH/2);
    ctx.moveTo(0, 0);
    ctx.lineTo(-btH/3, -btH/3);
    ctx.moveTo(0, 0);
    ctx.lineTo(-btH/3, btH/3);
    ctx.stroke();
    ctx.restore();

    // Battery (Vertical Icon)
    const battX = w/2 + 22; // Adjusted for larger size
    const battW = statusSize * 0.6;
    const battH = statusSize * 0.9;
    
    ctx.strokeRect(battX, statusY - battH/2, battW, battH);
    ctx.fillRect(battX + 2, statusY - battH/2 - 2, battW - 4, 2); 
    ctx.fillRect(battX + 1.5, statusY + battH/2 - (battH * 0.7), battW - 3, battH * 0.7 - 1.5); 
    
    setFont("400", statusSize * 0.85); // Slightly larger font
    ctx.textAlign = "left";
    ctx.fillText("80%", battX + battW + 6, statusY + 2);
    ctx.restore();
    
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
