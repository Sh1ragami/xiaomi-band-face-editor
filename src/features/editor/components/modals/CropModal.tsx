import { useRef, useState } from 'react';
import type { Crop, ImageLayer } from '@/shared/types';

type DragHandle = 'move' | 'tl' | 'br' | null;

export default function CropModal({ layer, onClose, onSave }: { layer: ImageLayer; onClose: () => void; onSave: (crop: Crop)=>void }) {
  const [crop, setCrop] = useState<Crop>(layer.crop || { x: 0, y: 0, w: 1, h: 1 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<DragHandle>(null);
  const handleMouseMove = (evt: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect();
    const cx = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width));
    const cy = Math.max(0, Math.min(1, (evt.clientY - rect.top) / rect.height));
    if (dragging === 'br') setCrop((p) => ({ ...p, w: Math.max(0.05, cx - p.x), h: Math.max(0.05, cy - p.y) }));
    else if (dragging === 'tl') { const nx = Math.min(cx, crop.x + crop.w - 0.05), ny = Math.min(cy, crop.y + crop.h - 0.05); setCrop((p) => ({ ...p, x: nx, y: ny, w: p.w + (p.x - nx), h: p.h + (p.y - ny) })); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onMouseMove={handleMouseMove} onMouseUp={()=>setDragging(null)}>
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full flex flex-col h-[80vh]">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">トリミング編集</h3><div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">キャンセル</button><button onClick={()=>onSave(crop)} className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">適用</button></div></div>
        <div className="flex-1 relative bg-gray-100 rounded overflow-hidden flex items-center justify-center select-none">
          <div className="relative" ref={containerRef}>
            <img src={layer.src} className="max-h-[60vh] max-w-full object-contain block pointer-events-none" alt="" />
            <div className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }} onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDragging('move');}}>
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-violet-500 cursor-nw-resize" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDragging('tl');}} />
              <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-violet-500 cursor-se-resize" onMouseDown={(e)=>{e.preventDefault(); e.stopPropagation(); setDragging('br');}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
