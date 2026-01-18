import React from 'react';
import { CloseIcon } from '@/shared/icons';
import type { Layer, TextLayer, ShadowSettings, StrokeSettings, TextCurveSettings } from '@/shared/types';

type Props = {
  selectedLayer?: Layer;
  updateSelected: (patch: Partial<Layer>, save?: boolean) => void;
  onClose?: () => void;
};

export default function EffectsPanel({ selectedLayer, updateSelected, onClose }: Props) {
  if (!selectedLayer) {
    return (
      <div className="animate-in fade-in duration-300">
        <h2 className="panel-header">エフェクト</h2>
        <p className="text-sm text-gray-500">左のキャンバスでレイヤーを選択すると設定できます。</p>
      </div>
    );
  }

  const updateShadow = (patch: Partial<ShadowSettings>) => {
    updateSelected({ shadow: { ...(selectedLayer.shadow || { enabled: false, color: '#000000', blur: 10, offsetX: 5, offsetY: 5 }), ...patch } }, true);
  };

  const updateStroke = (patch: Partial<StrokeSettings>) => {
    updateSelected({ stroke: { ...(selectedLayer.stroke || { enabled: false, color: '#000000', width: 2 }), ...patch } }, true);
  };

  const updateCurve = (patch: Partial<TextCurveSettings>) => {
    if (selectedLayer.type !== 'text' && selectedLayer.type !== 'clock') return;
    updateSelected({ curve: { ...(((selectedLayer as TextLayer).curve) || { enabled: false, radius: 200, spacing: 0 }), ...patch } } as any, true);
  };

  const title = selectedLayer.type === 'rect' || selectedLayer.type === 'circle' ? '編集' : 'エフェクト';

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="panel-header m-0">{title}</h2>
        {onClose && (
          <button onClick={onClose} aria-label="閉じる" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters (image only) */}
      {selectedLayer.type === 'image' && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">色調整</h3>
          {(['brightness','contrast','saturate'] as const).map((f) => {
            const val = (selectedLayer as any)[f] ?? 100;
            const label = f === 'brightness' ? '明るさ' : f === 'contrast' ? 'コントラスト' : '彩度';
            return (
              <div key={f}>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{label}</span><span>{val}%</span></div>
                <input type="range" min="0" max="200" value={val} onChange={(e)=>updateSelected({[f]: parseInt((e.target as HTMLInputElement).value)} as any, true)} className="w-full accent-violet-600" />
              </div>
            );
          })}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>グレースケール</span><span>{selectedLayer.grayscale||0}%</span></div>
            <input type="range" min="0" max="100" value={selectedLayer.grayscale||0} onChange={(e)=>updateSelected({grayscale: parseInt((e.target as HTMLInputElement).value)}, true)} className="w-full accent-violet-600" />
          </div>
        </section>
      )}

      {/* Stroke (text/rect/circle) */}
      {(selectedLayer.type === 'text' || selectedLayer.type === 'clock' || selectedLayer.type === 'rect' || selectedLayer.type === 'circle') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">縁取り</h3>
            <input type="checkbox" checked={selectedLayer.stroke?.enabled || false} onChange={(e) => updateStroke({ enabled: e.target.checked })} className="w-5 h-5 accent-violet-600 cursor-pointer" />
          </div>
          {selectedLayer.stroke?.enabled && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">色</label>
                <input type="color" value={selectedLayer.stroke?.color || '#000000'} onChange={(e) => updateStroke({ color: (e.target as HTMLInputElement).value })} className="w-full h-10 rounded cursor-pointer border-none bg-transparent" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">太さ: {selectedLayer.stroke?.width || 2}px</label>
                <input type="range" min="1" max="20" value={selectedLayer.stroke?.width || 2} onChange={(e) => updateStroke({ width: parseInt((e.target as HTMLInputElement).value) })} className="w-full accent-violet-600" />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Shadow (all layers support shadow via applyDecorations) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">影（ドロップシャドウ）</h3>
          <input type="checkbox" checked={selectedLayer.shadow?.enabled || false} onChange={(e) => updateShadow({ enabled: e.target.checked })} className="w-5 h-5 accent-violet-600 cursor-pointer" />
        </div>
        {selectedLayer.shadow?.enabled && (
          <div className="space-y-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">影の色</label>
                <input type="color" value={selectedLayer.shadow?.color || '#000000'} onChange={(e) => updateShadow({ color: (e.target as HTMLInputElement).value })} className="w-full h-10 rounded cursor-pointer border-none bg-transparent" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">ぼかし: {selectedLayer.shadow?.blur || 10}px</label>
                <input type="range" min="0" max="50" value={selectedLayer.shadow?.blur || 10} onChange={(e) => updateShadow({ blur: parseInt((e.target as HTMLInputElement).value) })} className="w-full accent-violet-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">位置 X: {selectedLayer.shadow?.offsetX || 5}px</label>
                <input type="range" min="-30" max="30" value={selectedLayer.shadow?.offsetX || 5} onChange={(e) => updateShadow({ offsetX: parseInt((e.target as HTMLInputElement).value) })} className="w-full accent-violet-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">位置 Y: {selectedLayer.shadow?.offsetY || 5}px</label>
                <input type="range" min="-30" max="30" value={selectedLayer.shadow?.offsetY || 5} onChange={(e) => updateShadow({ offsetY: parseInt((e.target as HTMLInputElement).value) })} className="w-full accent-violet-600" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Curve (text only) */}
      {(selectedLayer.type === 'text' || selectedLayer.type === 'clock') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">曲線配置（アーチ）</h3>
            <input type="checkbox" checked={(selectedLayer as TextLayer).curve?.enabled || false} onChange={(e) => updateCurve({ enabled: e.target.checked })} className="w-5 h-5 accent-violet-600 cursor-pointer" />
          </div>
          {(selectedLayer as TextLayer).curve?.enabled && (
            <div className="space-y-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">曲がり具合 (半径): {(selectedLayer as TextLayer).curve?.radius || 200}</label>
                <input type="range" min="50" max="1000" step="10" value={(selectedLayer as TextLayer).curve?.radius || 200} onChange={(e) => updateCurve({ radius: parseInt((e.target as HTMLInputElement).value) })} className="w-full accent-violet-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">文字間隔: {(selectedLayer as TextLayer).curve?.spacing || 0}</label>
                <input type="range" min="-50" max="100" value={(selectedLayer as TextLayer).curve?.spacing || 0} onChange={(e) => updateCurve({ spacing: parseInt((e.target as HTMLInputElement).value) })} className="w-full accent-violet-600" />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
