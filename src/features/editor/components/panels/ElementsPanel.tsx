import type { Layer } from '@/shared/types';

export default function ElementsPanel({ onAdd }: { onAdd: (patch: Partial<Layer>) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">図形</h2>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onAdd({ type: 'rect', width: 100, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-10 h-10 bg-gray-400 rounded-sm" /></button>
        <button onClick={() => onAdd({ type: 'circle', width: 100, height: 100, fill: '#ffffff' })} className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"><div className="w-10 h-10 bg-gray-400 rounded-full" /></button>
      </div>
    </div>
  );
}
