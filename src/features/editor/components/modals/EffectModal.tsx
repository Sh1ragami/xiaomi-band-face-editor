import React from 'react';
import type { Layer, ShadowSettings, StrokeSettings, TextCurveSettings, TextLayer } from '@/shared/types';

type Props = {
  layer: Layer;
  onClose: () => void;
  onSave: (patch: Partial<Layer>) => void;
};

export default function EffectModal({ layer, onClose, onSave }) {
  const updateShadow = (patch: Partial<ShadowSettings>) => {
    onSave({ shadow: { ...(layer.shadow || { enabled: false, color: '#000000', blur: 10, offsetX: 5, offsetY: 5 }), ...patch } });
  };

  const updateStroke = (patch: Partial<StrokeSettings>) => {
    onSave({ stroke: { ...(layer.stroke || { enabled: false, color: '#000000', width: 2 }), ...patch } });
  };

  const updateCurve = (patch: Partial<TextCurveSettings>) => {
    if (layer.type !== 'text' && layer.type !== 'clock') return;
    onSave({ curve: { ...(layer.curve || { enabled: false, radius: 200, spacing: 0 }), ...patch } } as any);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">エフェクト設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] thin-scrollbar">
          {/* Outline / Stroke */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>縁取り
              </h3>
              <input type="checkbox" checked={layer.stroke?.enabled || false} onChange={(e) => updateStroke({ enabled: e.target.checked })} className="w-5 h-5 accent-violet-600 cursor-pointer" />
            </div>
            {layer.stroke?.enabled && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">色</label>
                  <input type="color" value={layer.stroke?.color || '#000000'} onChange={(e) => updateStroke({ color: e.target.value })} className="w-full h-10 rounded cursor-pointer border-none bg-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium">太さ: {layer.stroke?.width || 2}px</label>
                  <input type="range" min="1" max="20" value={layer.stroke?.width || 2} onChange={(e) => updateStroke({ width: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                </div>
              </div>
            )}
          </section>

          {/* Shadow */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>影（ドロップシャドウ）
              </h3>
              <input type="checkbox" checked={layer.shadow?.enabled || false} onChange={(e) => updateShadow({ enabled: e.target.checked })} className="w-5 h-5 accent-violet-600 cursor-pointer" />
            </div>
            {layer.shadow?.enabled && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">影の色</label>
                    <input type="color" value={layer.shadow?.color || '#000000'} onChange={(e) => updateShadow({ color: e.target.value })} className="w-full h-10 rounded cursor-pointer border-none bg-transparent" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">ぼかし: {layer.shadow?.blur || 10}px</label>
                    <input type="range" min="0" max="50" value={layer.shadow?.blur || 10} onChange={(e) => updateShadow({ blur: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">位置 X: {layer.shadow?.offsetX || 5}px</label>
                    <input type="range" min="-30" max="30" value={layer.shadow?.offsetX || 5} onChange={(e) => updateShadow({ offsetX: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">位置 Y: {layer.shadow?.offsetY || 5}px</label>
                    <input type="range" min="-30" max="30" value={layer.shadow?.offsetY || 5} onChange={(e) => updateShadow({ offsetY: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Curve (Text only) */}
          {(layer.type === 'text' || layer.type === 'clock') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>曲線配置（アーチ）
                </h3>
                <input type="checkbox" checked={(layer as TextLayer).curve?.enabled || false} onChange={(e) => updateCurve({ enabled: e.target.checked })} className="w-5 h-5 accent-violet-600 cursor-pointer" />
              </div>
              {(layer as TextLayer).curve?.enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">曲がり具合 (半径): {(layer as TextLayer).curve?.radius || 200}</label>
                    <input type="range" min="50" max="1000" step="10" value={(layer as TextLayer).curve?.radius || 200} onChange={(e) => updateCurve({ radius: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">文字間隔: {(layer as TextLayer).curve?.spacing || 0}</label>
                    <input type="range" min="-50" max="100" value={(layer as TextLayer).curve?.spacing || 0} onChange={(e) => updateCurve({ spacing: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all active:scale-[0.98]">
            適用して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
