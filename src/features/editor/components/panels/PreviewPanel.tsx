import LayoutPreviewThumb from '../LayoutPreviewThumb';
import type { Template } from '@/shared/templates';

type Style = { id: string; label: string };

export default function PreviewPanel({ styles, selected, onSelect, template }: { styles: Style[]; selected: string | null; onSelect: (id: string | null) => void; template: Template }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">プレビュー</h2>
      <p className="text-xs text-gray-500 mb-3">実際の時刻表示イメージを確認できます。この文字は画像には書き出されません。</p>
      <div className="grid grid-cols-2 gap-3">
        {styles.map(style => (
          <button key={style.id} onClick={() => onSelect(style.id === 'none' ? null : style.id)} className={`p-3 rounded-lg border text-center text-sm flex flex-col items-center ${selected === style.id || (style.id==='none' && !selected) ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
            <div className="w-20"><LayoutPreviewThumb styleId={style.id} template={template} /></div>
            <div className="mt-2 w-24 whitespace-nowrap text-xs">{style.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
