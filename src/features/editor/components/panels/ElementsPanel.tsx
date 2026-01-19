import type { Layer } from '@/shared/types';

export default function ElementsPanel({ onAdd }: { onAdd: (patch: Partial<Layer>) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">図形</h2>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onAdd({ type: 'rect', width: 160, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-12 h-8 bg-gray-400 rounded-sm" /></button>
        <button onClick={() => onAdd({ type: 'rect', width: 160, height: 100, fill: '#ffffff', cornerRadius: 16 })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-12 h-8 bg-gray-400 rounded-lg" /></button>
        <button onClick={() => onAdd({ type: 'circle', width: 100, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-10 h-10 bg-gray-400 rounded-full" /></button>
        <button onClick={() => onAdd({ type: 'triangle', width: 120, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10 fill-gray-400"><polygon points="50,10 90,90 10,90"/></svg>
        </button>
        <button onClick={() => onAdd({ type: 'line', width: 200, height: 6, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="w-14 h-1.5 bg-gray-400" />
        </button>
        <button onClick={() => onAdd({ type: 'arrow', width: 200, height: 60, fill: '#ffffff', headRatio: 0.32, shaftRatio: 0.35 })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 200 100" className="w-16 h-8 fill-gray-400"><rect x="10" y="40" width="120" height="20" rx="3"/><polygon points="140,20 190,50 140,80"/></svg>
        </button>
        <button onClick={() => onAdd({ type: 'star', width: 120, height: 120, fill: '#ffffff', points: 5, innerRatio: 0.5 })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10 fill-gray-400"><polygon points="50,5 61,38 95,38 67,58 78,91 50,72 22,91 33,58 5,38 39,38"/></svg>
        </button>
        <button onClick={() => onAdd({ type: 'diamond', width: 120, height: 120, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10 fill-gray-400"><polygon points="50,5 95,50 50,95 5,50"/></svg>
        </button>
        <button onClick={() => onAdd({ type: 'polygon', width: 120, height: 120, fill: '#ffffff', sides: 5 })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-10 h-10 fill-gray-400"><polygon points="50,5 90,38 74,85 26,85 10,38"/></svg>
        </button>
      </div>
    </div>
  );
}
