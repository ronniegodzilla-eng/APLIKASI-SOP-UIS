import { Bell, User, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">Formulir Pembuatan SOP</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari dokumen..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0A5C36]/20 focus:border-[#0A5C36] transition-all w-64"
          />
        </div>

        <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
          <button className="p-2 hover:bg-gray-100 rounded-full relative transition-colors text-gray-500 hover:text-gray-700">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-[#0A5C36]/10 rounded-full flex items-center justify-center text-[#0A5C36] font-medium border border-[#0A5C36]/20">
              <User size={16} />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-none">Admin LPMI</p>
              <p className="text-xs text-gray-500 mt-1">admin.mutu@uis.ac.id</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
