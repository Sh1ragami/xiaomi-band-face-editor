import type { Layer } from '@/shared/types';

export default function TextPanel({ onAdd }: { onAdd: (patch: Partial<Layer>) => void }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">テキスト追加</h2>
      <div className="space-y-3">
        <button onClick={() => onAdd({ type: 'text', text: '見出しを追加', fontSize: 64, fontWeight: '700', color: '#ffffff' })} className="w-full py-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold text-gray-800 transition-colors">見出しを追加</button>
        <button onClick={() => onAdd({ type: 'text', text: '本文テキスト', fontSize: 32, fontWeight: '400', color: '#ffffff' })} className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-lg text-gray-700 transition-colors">本文テキスト</button>
      </div>
    </div>
  );
}
