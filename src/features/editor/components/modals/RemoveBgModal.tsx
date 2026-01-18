import { useEffect, useRef, useState } from 'react';
import type { ImageLayer } from '@/shared/types';

// utility
const processRemoveColor = (canvas: HTMLCanvasElement, targetHex: string, tolerance: number) => {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const rT = parseInt(targetHex.slice(1, 3), 16);
  const gT = parseInt(targetHex.slice(3, 5), 16);
  const bT = parseInt(targetHex.slice(5, 7), 16);
  const tol = tolerance * 2.55;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const dist = Math.sqrt((r - rT)**2 + (g - gT)**2 + (b - bT)**2);
    if (dist <= tol) data[i+3] = 0;
  }
  ctx.putImageData(imageData, 0, 0);
};

export default function RemoveBgModal({ layer, onClose, onSave }: { layer: ImageLayer; onClose: () => void; onSave: (img: HTMLImageElement, url: string)=>void }) {
  const [mode, setMode] = useState<'color'|'brush'>('color');
  const [color, setColor] = useState('#000000');
  const [tolerance, setTolerance] = useState(40);
  const [brushType, setBrushType] = useState<'erase'|'restore'>('erase');
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const w = layer.image?.width ?? 0, h = layer.image?.height ?? 0;
    const wc = document.createElement('canvas'); wc.width = w; wc.height = h; wc.getContext('2d')!.drawImage(layer.image!, 0, 0); workingCanvasRef.current = wc;
    const oc = document.createElement('canvas'); oc.width = w; oc.height = h; oc.getContext('2d')!.drawImage(layer.image!, 0, 0); originalCanvasRef.current = oc;
    updateP();
  }, [layer]);

  const updateP = () => {
    const c = canvasRef.current as HTMLCanvasElement | null;
    const wc = workingCanvasRef.current as HTMLCanvasElement | null;
    if (!c || !wc) return; c.width = wc.width; c.height = wc.height; const ctx = c.getContext('2d')!; ctx.clearRect(0,0,c.width,c.height); ctx.drawImage(wc, 0, 0);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => { const c = canvasRef.current as HTMLCanvasElement; const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }; };

  const dBrush = (pos: {x:number;y:number}) => {
    if (!workingCanvasRef.current) return; const ctx = (workingCanvasRef.current as HTMLCanvasElement).getContext('2d')!; const r = brushSize / 2;
    if (brushType === 'restore') { ctx.save(); ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.clip(); ctx.clearRect(pos.x-r, pos.y-r, r*2, r*2); ctx.drawImage((originalCanvasRef.current as HTMLCanvasElement), 0, 0); ctx.restore(); }
    else {
      const imgData = ctx.getImageData(pos.x-r, pos.y-r, r*2, r*2); const data = imgData.data;
      const rT = parseInt(color.slice(1,3),16), gT = parseInt(color.slice(3,5),16), bT = parseInt(color.slice(5,7),16), tol = tolerance * 2.55;
      for (let i=0; i<data.length; i+=4) { if (Math.sqrt((data[i]-rT)**2 + (data[i+1]-gT)**2 + (data[i+2]-bT)**2) <= tol) data[i+3]=0; }
      ctx.putImageData(imgData, pos.x-r, pos.y-r);
    }
    updateP();
  };

  const handleSave = () => { const url = (workingCanvasRef.current as HTMLCanvasElement).toDataURL("image/png"); const img = new Image(); img.onload = () => onSave(img, url); img.src = url; };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onMouseUp={()=>setIsDrawing(false)}>
      <div className="bg-white rounded-lg p-4 max-w-5xl w-full flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">背景透過</h3><div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">キャンセル</button><button onClick={handleSave} className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700">適用</button></div></div>
        <div className="flex gap-4 flex-1 overflow-hidden">
          <div className="w-64 flex flex-col gap-6 p-4 bg-gray-50 rounded h-full shrink-0">
            <div className="flex rounded bg-white border border-gray-200 p-1"><button onClick={()=>setMode('color')} className={`flex-1 py-1.5 text-sm rounded ${mode==='color'?'bg-indigo-100 text-indigo-700 font-bold':''}`}>自動</button><button onClick={()=>setMode('brush')} className={`flex-1 py-1.5 text-sm rounded ${mode==='brush'?'bg-indigo-100 text-indigo-700 font-bold':''}`}>ブラシ</button></div>
            {mode === 'color' ? (
              <div className="space-y-4">
                <div><label className="text-xs font-bold block mb-1">除去色</label><input type="color" value={color} onChange={(e)=>setColor((e.target as HTMLInputElement).value)} className="w-full h-10 rounded border cursor-pointer" /></div>
                <input type="range" min="1" max="100" value={tolerance} onChange={(e)=>setTolerance(parseInt((e.target as HTMLInputElement).value))} className="w-full" />
                <button onClick={()=>{ if (workingCanvasRef.current) { processRemoveColor(workingCanvasRef.current, color, tolerance); updateP(); } }} className="w-full py-2 bg-indigo-600 text-white rounded">一括除去</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex rounded bg-white border border-gray-200 p-1"><button onClick={()=>setBrushType('erase')} className={`flex-1 py-1.5 text-sm rounded ${brushType==='erase'?'bg-red-100 text-red-700 font-bold':''}`}>消す</button><button onClick={()=>setBrushType('restore')} className={`flex-1 py-1.5 text-sm rounded ${brushType==='restore'?'bg-green-100 text-green-700 font-bold':''}`}>戻す</button></div>
                <input type="range" min="5" max="100" value={brushSize} onChange={(e)=>setBrushSize(parseInt((e.target as HTMLInputElement).value))} className="w-full" />
                {brushType==='erase' && <input type="range" min="1" max="100" value={tolerance} onChange={(e)=>setTolerance(parseInt((e.target as HTMLInputElement).value))} className="w-full" />}
              </div>
            )}
          </div>
          <div className="flex-1 bg-[url('https://transparent-textures.sourceforge.io/patterns/diagmonds-light.png')] bg-gray-200 rounded flex items-center justify-center overflow-auto border">
            <canvas ref={canvasRef} onMouseDown={(e)=>{setIsDrawing(true); dBrush(getPos(e));}} onMouseMove={(e)=>{if(isDrawing) dBrush(getPos(e));}} className="max-w-full max-h-full object-contain shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
