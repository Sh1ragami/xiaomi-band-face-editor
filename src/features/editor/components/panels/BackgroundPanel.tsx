export default function BackgroundPanel({ value, onChange, presets = ["#000000", "#ffffff", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"] }: { value: string; onChange: (color: string) => void; presets?: string[] }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">背景色</h2>
      <div className="space-y-4">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-12 rounded cursor-pointer" />
        <div className="flex flex-wrap gap-2">
          {presets.map(c => (
            <button key={c} onClick={()=>onChange(c)} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{backgroundColor: c}} />
          ))}
        </div>
      </div>
    </div>
  );
}

