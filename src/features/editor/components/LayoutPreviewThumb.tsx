import { useEffect, useRef } from 'react';
import type { Template } from '@/shared/templates';
import { drawRoundedRectPath, getCornerRadiusPx, drawLayoutPreview } from '@/shared/canvas';

export default function LayoutPreviewThumb({ styleId, template }: { styleId: string; template: Template }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ratio = template.canvas.h / template.canvas.w;
    const W = 80; const H = Math.round(W * ratio);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const r = getCornerRadiusPx(W, H, template);
    ctx.save();
    drawRoundedRectPath(ctx, 0, 0, W, H, r);
    ctx.fillStyle = '#0b0f17';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    drawRoundedRectPath(ctx, 2, 2, W-4, H-4, Math.max(0, r-2));
    ctx.stroke();
    ctx.restore();
    if (styleId && styleId !== 'none') drawLayoutPreview(ctx, W, H, styleId);
  }, [styleId, template]);
  return <canvas ref={ref} className="w-full h-auto block" />;
}

