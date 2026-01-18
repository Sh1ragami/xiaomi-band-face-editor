import Head from "next/head";
import { useRef, useState } from "react";
import CanvasEditor from "../components/CanvasEditor";
import { TEMPLATES } from "../components/templates";
import { DownloadIcon } from "../components/Icons";

export default function Home() {
  const [tplId, setTplId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === tplId);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState("png");
  const [exportScale, setExportScale] = useState(2);
  const exportRef = useRef(null);
  const registerExport = (fn) => { exportRef.current = fn; };

  const handleExport = () => {
    if (exportRef.current) {
      exportRef.current(exportFormat, exportScale);
      setShowExport(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100">
      <Head>
        <title>Xiaomi Band Face Editor</title>
      </Head>
      {/* Top Navigation Bar - Canva style */}
      <header className="h-14 bg-gradient-to-r from-violet-700 to-indigo-700 text-white flex items-center justify-between px-4 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg tracking-tight">Xiaomi Band Face Editor</div>
          <div className="h-6 w-px bg-white/20 mx-2"></div>
          {/* Template Selector as 'File' menu */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-100 font-medium uppercase tracking-wider">Device:</span>
            <select 
              className="bg-white/10 hover:bg-white/20 text-sm border-none rounded px-3 py-1.5 focus:ring-2 focus:ring-white/50 cursor-pointer transition-colors"
              value={tplId} 
              onChange={(e)=>setTplId(e.target.value)}
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id} className="text-gray-900">{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              className="flex items-center gap-2 px-4 py-1.5 rounded bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
              onClick={()=>setShowExport(!showExport)}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>ダウンロード</span>
            </button>
            
            {showExport && (
              <>
                <div className="fixed inset-0 z-10" onClick={()=>setShowExport(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-100 p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="font-semibold text-gray-900 mb-3">ダウンロード設定</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">ファイル形式</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" 
                        value={exportFormat} 
                        onChange={(e)=>setExportFormat(e.target.value)}
                      >
                        <option value="png">PNG (高画質)</option>
                        <option value="jpeg">JPEG (軽量)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">サイズ倍率</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" 
                        value={exportScale} 
                        onChange={(e)=>setExportScale(parseInt(e.target.value))}
                      >
                        <option value={1}>1x (標準)</option>
                        <option value={2}>2x (高解像度)</option>
                        <option value={3}>3x (超高解像度)</option>
                      </select>
                    </div>
                    <button 
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium transition-colors" 
                      onClick={handleExport}
                    >
                      画像を保存
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <CanvasEditor template={template} registerExport={registerExport} />
    </div>
  );
}
