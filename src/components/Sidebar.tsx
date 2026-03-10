import { Home, FileText, Settings, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#0A5C36] text-white flex flex-col min-h-screen shadow-xl z-10">
      <div className="p-6 flex items-center space-x-3 border-b border-white/10">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-[#0A5C36] font-bold text-xl">UIS</span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wide leading-tight text-yellow-400">SOP</h2>
          <p className="text-xs text-green-100 opacity-80">Universitas Ibnu Sina</p>
        </div>
      </div>
      
      <div className="px-4 py-6">
        <p className="text-xs font-semibold text-green-200/60 uppercase tracking-wider mb-4 px-2">Menu Utama</p>
        <nav className="space-y-1.5">
          <a href="#" className="flex items-center space-x-3 px-3 py-2.5 bg-white/10 rounded-lg text-yellow-400 border border-white/5 shadow-sm">
            <FileText size={20} />
            <span className="font-medium text-sm">Buat SOP Baru</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-green-50">
            <Home size={20} />
            <span className="font-medium text-sm">Dashboard</span>
          </a>
        </nav>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-green-200/60 uppercase tracking-wider mb-4 px-2">Sistem</p>
        <nav className="space-y-1.5">
          <a href="#" className="flex items-center space-x-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-green-50">
            <Settings size={20} />
            <span className="font-medium text-sm">Pengaturan</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-green-50">
            <HelpCircle size={20} />
            <span className="font-medium text-sm">Panduan Mutu</span>
          </a>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-white/10">
        <div className="bg-black/20 rounded-lg p-4">
          <p className="text-xs text-green-100/80 leading-relaxed">
            Sistem Penjaminan Mutu Internal (SPMI) Universitas Ibnu Sina
          </p>
        </div>
      </div>
    </div>
  );
}
