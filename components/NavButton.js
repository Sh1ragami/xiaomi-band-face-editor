import React from "react";

export default function NavButton({ icon: IconComp, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 transition-all duration-200 group ${active ? 'text-violet-600 bg-violet-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
    >
      <IconComp className={`w-6 h-6 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}