import { EyeIcon, EyeOffIcon, TrashIcon } from '@/shared/icons';
import type { Layer } from '@/shared/types';

export default function LayerList({ layers, selectedId, onSelect, onToggleHidden, onDelete, draggingLayerId, setDraggingLayerId, dragOverLayerId, setDragOverLayerId, onDrop }: {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onDelete: (id: string) => void;
  draggingLayerId: string | null;
  setDraggingLayerId: (id: string | null) => void;
  dragOverLayerId: string | null;
  setDragOverLayerId: (id: string | null) => void;
  onDrop: (targetId: string) => void;
}) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">レイヤー</h2>
      <div className="space-y-2">
        {layers.slice().reverse().map((layer: Layer) => (
          <div key={layer.id}
               draggable
               onDragStart={(e)=>{ setDraggingLayerId(layer.id); e.dataTransfer.effectAllowed='move'; }}
               onDragOver={(e)=>{ e.preventDefault(); setDragOverLayerId(layer.id); }}
               onDragLeave={()=>{ setDragOverLayerId(null); }}
               onDrop={(e)=>{ e.preventDefault(); onDrop(layer.id); }}
               className={`flex items-center gap-2 p-2 rounded border cursor-move select-none ${selectedId === layer.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'} ${dragOverLayerId===layer.id ? 'ring-2 ring-violet-400' : ''}`}
               onClick={()=>onSelect(layer.id)}
          >
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center shrink-0 text-xs overflow-hidden">
              {layer.type === 'image' && layer.src && <img src={layer.src} className="w-full h-full object-cover" alt="" />}
              {layer.type === 'text' && 'T'}
              {layer.type === 'clock' && '🕒'}
              {layer.type === 'rect' && '⬛'}
              {layer.type === 'circle' && '●'}
            </div>
            <div className="text-sm truncate flex-1">{layer.name || layer.type}</div>
            <button className="text-gray-500 hover:text-gray-900" onClick={(e) => { e.stopPropagation(); onToggleHidden(layer.id); }}>{layer.hidden ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
            <button className="text-red-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}><TrashIcon className="w-4 h-4" /></button>
          </div>
        ))}
        {layers.length === 0 && <div className="text-sm text-gray-400 text-center py-4">レイヤーがありません</div>}
      </div>
    </div>
  );
}
