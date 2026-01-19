import { EyeIcon, EyeOffIcon, MagicWandIcon, PaletteIcon, ScissorsIcon, TrashIcon } from '@/shared/icons';
import type { Layer, TextLayer } from '@/shared/types';
import React from 'react';

type Props = {
  selectedLayer?: Layer;
  updateSelected: (patch: Partial<Layer>, save?: boolean) => void;
  setCroppingLayerId: (id: string | null) => void;
  setBgRemovingLayerId: (id: string | null) => void;
  openEffectsPanel: () => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  deleteSelected: () => void;
};

export default function Toolbar({ selectedLayer, updateSelected, setCroppingLayerId, setBgRemovingLayerId, openEffectsPanel, showFilters, setShowFilters, deleteSelected }: Props) {
  if (!selectedLayer) return null;
  return (
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
              {['brightness','contrast','saturate'].map((f) => {
                const val = (selectedLayer as any)[f] ?? 100;
                return (
                  <div key={f}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span className="capitalize">{f}</span><span>{val}%</span></div>
                    <input type="range" min="0" max="200" value={val} onChange={(e)=>updateSelected({[f]: parseInt((e.target as HTMLInputElement).value)} as any, true)} className="w-full accent-violet-600" />
                  </div>
                );
              })}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Grayscale</span><span>{selectedLayer.grayscale||0}%</span></div>
                <input type="range" min="0" max="100" value={selectedLayer.grayscale||0} onChange={(e)=>updateSelected({grayscale: parseInt((e.target as HTMLInputElement).value)}, true)} className="w-full accent-violet-600" />
              </div>
            </div>
          )}
        </>
      )}

      {(selectedLayer.type === 'text' || selectedLayer.type === 'clock') && (
        <>
          <input type="color" value={(selectedLayer as TextLayer).color || '#ffffff'} onChange={(e)=>updateSelected({color: (e.target as HTMLInputElement).value}, true)} className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5" />
          <div className="flex items-center bg-gray-100 rounded-md px-2 py-1"><span className="text-[10px] text-gray-500 font-bold mr-2">SIZE</span><input type="number" value={(selectedLayer as TextLayer).fontSize || 48} onChange={(e)=>updateSelected({fontSize: parseInt((e.target as HTMLInputElement).value)}, true)} className="w-12 bg-transparent text-sm font-medium focus:outline-none" /><span className="text-[10px] text-gray-400 ml-1">px</span></div>
          <select value={(selectedLayer as TextLayer).fontWeight || '700'} onChange={(e)=>updateSelected({fontWeight: (e.target as HTMLSelectElement).value}, true)} className="bg-gray-100 rounded-md px-2 py-1 text-sm font-medium focus:outline-none border-none cursor-pointer">
            <option value="400">Regular</option>
            <option value="700">Bold</option>
            <option value="900">Black</option>
          </select>
          <select value={(selectedLayer as TextLayer).fontFamily || 'sans-serif'} onChange={(e)=>updateSelected({fontFamily: (e.target as HTMLSelectElement).value}, true)} className="bg-gray-100 rounded-md px-2 py-1 text-sm font-medium focus:outline-none border-none cursor-pointer">
            <option value="sans-serif">Sans</option>
            <option value="system-ui">System UI</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="'Inter', system-ui, sans-serif">Inter</option>
            <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
            <option value="'Arial', sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
          </select>
          {selectedLayer.type === 'text' && (
            <input type="text" value={(selectedLayer as TextLayer).text || ''} onChange={(e)=>updateSelected({text: (e.target as HTMLInputElement).value}, true)} className="bg-gray-100 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-violet-500 outline-none w-40" placeholder="テキスト..." />
          )}
          <button onClick={openEffectsPanel} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"><MagicWandIcon className="w-4 h-4" /><span>エフェクト</span></button>
        </>
      )}

      {(selectedLayer.type === 'rect' || selectedLayer.type === 'circle' || selectedLayer.type === 'triangle' || selectedLayer.type === 'line' || selectedLayer.type === 'arrow' || selectedLayer.type === 'star' || selectedLayer.type === 'diamond' || selectedLayer.type === 'polygon') && (
        <>
          <input type="color" value={(selectedLayer as any).fill || '#ffffff'} onChange={(e)=>updateSelected({fill: (e.target as HTMLInputElement).value}, true)} className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5" />
          <button onClick={openEffectsPanel} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><MagicWandIcon className="w-4 h-4" /><span>編集</span></button>
        </>
      )}

      <div className="h-6 w-px bg-gray-200 shrink-0" />
      <div className="flex items-center gap-2 shrink-0"><input type="range" min="0" max="1" step="0.1" value={selectedLayer.opacity ?? 1} onChange={(e) => updateSelected({ opacity: parseFloat((e.target as HTMLInputElement).value) }, true)} className="w-20 accent-violet-600 h-1.5" /></div>
      <button onClick={()=>updateSelected({hidden: !selectedLayer.hidden}, true)} className={`p-1.5 rounded ${selectedLayer.hidden ? 'bg-red-50 text-red-500' : 'hover:bg-gray-100 text-gray-600'}`}>{selectedLayer.hidden ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
      <button onClick={deleteSelected} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><TrashIcon className="w-4 h-4" /></button>
    </div>
  );
}
