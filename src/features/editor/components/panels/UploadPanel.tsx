import { UploadIcon } from '@/shared/icons';

type Asset = { id: string; url: string } & Record<string, any>;

export default function UploadPanel({ assets, onUpload, onAddImage }: { assets: Asset[]; onUpload: (files: FileList | null) => void; onAddImage: (asset: Asset) => void; }) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="panel-header">画像</h2>
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-violet-300 border-dashed rounded-lg cursor-pointer bg-violet-50 hover:bg-violet-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadIcon className="w-8 h-8 text-violet-500 mb-2" /><p className="text-sm text-violet-700 font-medium">クリックしてアップロード</p></div>
          <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => onUpload(e.target.files)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {assets.map(asset => (
          <button key={asset.id} onClick={() => onAddImage(asset)} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-violet-500 transition-all">
            <img src={asset.url} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

