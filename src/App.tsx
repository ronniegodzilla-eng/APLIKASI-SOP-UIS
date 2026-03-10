import React, { useState } from 'react';
import { 
  FileText, Users, ListOrdered, Eye, Printer, 
  Plus, Trash2, ArrowUp, ArrowDown, Settings, FileDown, Sparkles, Save 
} from 'lucide-react';
import { insertSopMetadata } from './services/sopService';
import { generatePdf } from './utils/pdfGenerator';
import { generateDocx } from './utils/docxGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState('meta');

  // --- STATE: Data Identitas SOP ---
  const [meta, setMeta] = useState({
    institusi: 'UNIVERSITAS IBNU SINA',
    unit: 'Fakultas Ilmu Komputer',
    judul: 'SOP Pengajuan Cuti Akademik',
    nomor: 'SOP/FIK/024/2026',
    tanggal: '03 Maret 2026',
    revisi: '01',
    halaman: '1 dari 2',
    tujuan: 'Memberikan pedoman dan tata cara yang baku bagi mahasiswa yang ingin mengajukan cuti akademik agar proses administrasi berjalan tertib.',
    ruangLingkup: 'SOP ini berlaku untuk seluruh mahasiswa aktif tingkat Sarjana (S1) yang telah menyelesaikan minimal 2 semester.',
    ringkasan: '',
    definisi: '1. Cuti Akademik adalah masa tidak mengikuti kegiatan akademik pada waktu tertentu.\n2. BAAK adalah Biro Administrasi Akademik dan Kemahasiswaan.',
    landasanHukum: '',
    keterkaitan: '',
    kualifikasiPelaksana: '',
    perlengkapan: '',
    peringatanResiko: '',
    formulir: '',
  });

  // --- STATE: Pelaksana (Actors/Swimlanes) ---
  const [actors, setActors] = useState([
    { id: 1, name: 'Mahasiswa' },
    { id: 2, name: 'Dosen Wali' },
    { id: 3, name: 'Kaprodi' },
    { id: 4, name: 'BAAK' }
  ]);

  // --- STATE: Prosedur / Langkah-langkah ---
  const [steps, setSteps] = useState([
    { id: 1, no: '1', text: 'Mulai: Mengisi form pengajuan cuti', actorId: 1, shape: 'start', waktu: '15 Menit', kelengkapan: 'KTM', output: 'Form Cuti' },
    { id: 2, no: '2', text: 'Mengecek alasan dan riwayat studi', actorId: 2, shape: 'process', waktu: '1 Hari', kelengkapan: 'Berkas', output: 'Rekomendasi' },
    { id: 3, no: '3', text: 'Keputusan Persetujuan Dosen Wali', actorId: 2, shape: 'decision', waktu: '1 Hari', kelengkapan: '-', output: 'TTD Persetujuan' },
    { id: 4, no: '4', text: 'Validasi dan Persetujuan Prodi', actorId: 3, shape: 'process', waktu: '1 Hari', kelengkapan: 'Draft', output: 'TTD Kaprodi' },
    { id: 5, no: '5', text: 'Menerbitkan Surat Cuti Resmi', actorId: 4, shape: 'document', waktu: '2 Hari', kelengkapan: 'Data', output: 'Surat Cuti' },
    { id: 6, no: '6', text: 'Selesai: Menerima Surat Cuti', actorId: 1, shape: 'end', waktu: '5 Menit', kelengkapan: '-', output: 'Arsip' }
  ]);

  // --- STATE: AI & Saving ---
  const [promptAI, setPromptAI] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---
  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const addActor = () => {
    const newId = actors.length > 0 ? Math.max(...actors.map(a => a.id)) + 1 : 1;
    setActors([...actors, { id: newId, name: 'Pelaksana Baru' }]);
  };

  const updateActor = (id: number, newName: string) => {
    setActors(actors.map(a => a.id === id ? { ...a, name: newName } : a));
  };

  const removeActor = (id: number) => {
    setActors(actors.filter(a => a.id !== id));
    // Reset steps that used this actor
    setSteps(steps.map(s => s.actorId === id ? { ...s, actorId: actors[0]?.id || 0 } : s));
  };

  const addStep = () => {
    const newId = steps.length > 0 ? Math.max(...steps.map(s => s.id)) + 1 : 1;
    setSteps([...steps, { 
      id: newId, 
      no: String(newId),
      text: 'Langkah Baru', 
      actorId: actors[0]?.id || 0, 
      shape: 'process', 
      waktu: '-', 
      kelengkapan: '-',
      output: '-' 
    }]);
  };

  const updateStep = (id: number, field: string, value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const moveStep = (index: number, direction: number) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + direction];
    newSteps[index + direction] = temp;
    setSteps(newSteps);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAI = async () => {
    if (!promptAI) {
      alert('Mohon isi deskripsi singkat terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaSop: meta.judul,
          unitKerja: meta.unit,
          deskripsi: promptAI,
        }),
      });

      if (!response.ok) throw new Error('Gagal menghasilkan draft dari server');

      const data = await response.json();
      
      // Update Meta
      setMeta(prev => ({
        ...prev,
        tujuan: data.tujuan || prev.tujuan,
        ruangLingkup: data.ruang_lingkup || prev.ruangLingkup,
        ringkasan: data.ringkasan || prev.ringkasan,
        definisi: data.definisi || prev.definisi,
        landasanHukum: data.landasan_hukum || prev.landasanHukum,
        keterkaitan: data.keterkaitan || prev.keterkaitan,
        kualifikasiPelaksana: data.kualifikasi_pelaksana || prev.kualifikasiPelaksana,
        perlengkapan: data.perlengkapan || prev.perlengkapan,
        peringatanResiko: data.peringatan_resiko || prev.peringatanResiko,
        formulir: data.formulir || prev.formulir,
      }));

      // Update Actors
      const uraianProsedur = data.uraian_prosedur || [];
      const uniqueActors = Array.from(new Set(uraianProsedur.map((item: any) => item.pelaksana))).filter(Boolean) as string[];
      const newActors = uniqueActors.map((name, idx) => ({ id: idx + 1, name }));
      if (newActors.length > 0) {
        setActors(newActors);
      } else {
        newActors.push(...actors); // fallback
      }

      // Update Steps
      const newSteps = uraianProsedur.map((item: any, idx: number) => {
        const actor = newActors.find(a => a.name === item.pelaksana);
        
        let shape = 'process';
        const textLower = (item.kegiatan || '').toLowerCase();
        if (idx === 0 || textLower.includes('mulai')) shape = 'start';
        else if (idx === uraianProsedur.length - 1 || textLower.includes('selesai')) shape = 'end';
        else if (textLower.includes('keputusan') || textLower.includes('persetujuan') || textLower.includes('validasi') || textLower.includes('?')) shape = 'decision';
        else if (textLower.includes('surat') || textLower.includes('dokumen') || textLower.includes('form')) shape = 'document';

        return {
          id: idx + 1,
          no: item.no || String(idx + 1),
          text: item.kegiatan,
          actorId: actor ? actor.id : (newActors[0]?.id || 0),
          shape: shape,
          waktu: item.waktu || '-',
          kelengkapan: item.kelengkapan || '-',
          output: item.output || '-'
        };
      });
      setSteps(newSteps);
      
      alert('Draft SOP berhasil dibuat oleh AI! Silakan periksa hasilnya di setiap tab.');
    } catch (error) {
      console.error('Error generating AI draft:', error);
      alert('Terjadi kesalahan saat membuat draft dengan AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDb = async () => {
    setIsSubmitting(true);
    try {
      // 1. Generate PDF Blob
      const blob = generatePdf(meta, actors, steps);
      const file = new File([blob], `SOP_${meta.judul || 'Draft'}.pdf`, { type: 'application/pdf' });
      
      // 2. Upload to GDrive
      const uploadData = new FormData();
      uploadData.append('file', file);

      const uploadRes = await fetch('/api/upload-gdrive', {
        method: 'POST',
        body: uploadData,
      });

      let finalGdriveLink = '';
      if (uploadRes.ok) {
        const { link } = await uploadRes.json();
        finalGdriveLink = link;
      } else {
        console.warn('Gagal mengunggah ke GDrive, melanjutkan penyimpanan tanpa link.');
      }

      // 3. Save to Supabase
      const mockUserId = '00000000-0000-0000-0000-000000000000'; 
      await insertSopMetadata({
        user_id: mockUserId,
        nama_sop: meta.judul,
        nomor_sop: meta.nomor,
        status: 'DRAFT',
        gdrive_link: finalGdriveLink,
      });
      
      alert('SOP Berhasil Disimpan ke Supabase' + (finalGdriveLink ? ' & GDrive!' : '!'));
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan SOP. Pastikan konfigurasi Supabase sudah benar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPONENTS ---
  const TabButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
        activeTab === id 
          ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
      {/* HEADER - Hides when printing */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-2 text-blue-700">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">SOP Maker PT</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveToDb}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-sm disabled:opacity-70"
          >
            <Save size={18} />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Database'}</span>
          </button>
          <button 
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-sm"
          >
            <Printer size={18} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </header>

      {/* TABS - Hides when printing */}
      <nav className="bg-white border-b px-6 flex overflow-x-auto print:hidden">
        <TabButton id="meta" icon={FileText} label="1. Identitas Dokumen" />
        <TabButton id="actors" icon={Users} label="2. Pelaksana (Aktor)" />
        <TabButton id="steps" icon={ListOrdered} label="3. Prosedur & Flowchart" />
        <TabButton id="preview" icon={Eye} label="4. Preview Hasil" />
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto p-6 print:p-0 print:m-0 print:overflow-visible">
        <div className="max-w-5xl mx-auto print:max-w-none print:w-full">
          
          {/* TAB 1: IDENTITAS */}
          {activeTab === 'meta' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border print:hidden">
              
              {/* AI GENERATOR SECTION */}
              <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-indigo-800 mb-2">
                  <Sparkles size={20} />
                  <h2 className="text-lg font-bold">Buat Draft Otomatis dengan AI</h2>
                </div>
                <p className="text-sm text-indigo-600 mb-3">Ceritakan secara singkat prosedur yang ingin Anda buat, AI akan mengisi seluruh form (Tujuan, Ruang Lingkup, Pelaksana, dan Langkah-langkah).</p>
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={promptAI}
                    onChange={(e) => setPromptAI(e.target.value)}
                    placeholder="Contoh: Prosedur peminjaman buku di perpustakaan oleh mahasiswa aktif..."
                    className="w-full border border-indigo-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                    rows={2}
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !promptAI}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                    >
                      {isGenerating ? 'AI Berpikir...' : 'Generate Draft dari Prompt'}
                    </button>
                    <button 
                      onClick={async () => {
                        setIsGenerating(true);
                        try {
                          const response = await fetch('/api/complete-sop', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ meta }),
                          });

                          if (!response.ok) throw new Error('Gagal melengkapi draft dari server');

                          const data = await response.json();
                          
                          // Update Meta
                          setMeta(prev => ({
                            ...prev,
                            tujuan: data.tujuan || prev.tujuan,
                            ruangLingkup: data.ruang_lingkup || prev.ruangLingkup,
                            ringkasan: data.ringkasan || prev.ringkasan,
                            definisi: data.definisi || prev.definisi,
                            landasanHukum: data.landasan_hukum || prev.landasanHukum,
                            keterkaitan: data.keterkaitan || prev.keterkaitan,
                            kualifikasiPelaksana: data.kualifikasi_pelaksana || prev.kualifikasiPelaksana,
                            perlengkapan: data.perlengkapan || prev.perlengkapan,
                            peringatanResiko: data.peringatan_resiko || prev.peringatanResiko,
                            formulir: data.formulir || prev.formulir,
                          }));

                          // Update Actors
                          const uraianProsedur = data.uraian_prosedur || [];
                          const uniqueActors = Array.from(new Set(uraianProsedur.map((item: any) => item.pelaksana))).filter(Boolean) as string[];
                          const newActors = uniqueActors.map((name, idx) => ({ id: idx + 1, name }));
                          if (newActors.length > 0) {
                            setActors(newActors);
                          } else {
                            newActors.push(...actors); // fallback
                          }

                          // Update Steps
                          const newSteps = uraianProsedur.map((item: any, idx: number) => {
                            const actor = newActors.find(a => a.name === item.pelaksana);
                            
                            let shape = 'process';
                            const textLower = (item.kegiatan || '').toLowerCase();
                            if (idx === 0 || textLower.includes('mulai')) shape = 'start';
                            else if (idx === uraianProsedur.length - 1 || textLower.includes('selesai')) shape = 'end';
                            else if (textLower.includes('keputusan') || textLower.includes('persetujuan') || textLower.includes('validasi') || textLower.includes('?')) shape = 'decision';
                            else if (textLower.includes('surat') || textLower.includes('dokumen') || textLower.includes('form')) shape = 'document';

                            return {
                              id: idx + 1,
                              no: item.no || String(idx + 1),
                              text: item.kegiatan,
                              actorId: actor ? actor.id : (newActors[0]?.id || 0),
                              shape: shape,
                              waktu: item.waktu || '-',
                              kelengkapan: item.kelengkapan || '-',
                              output: item.output || '-'
                            };
                          });
                          setSteps(newSteps);
                          
                          alert('Draft SOP berhasil dilengkapi oleh AI berdasarkan data yang ada!');
                        } catch (error) {
                          console.error('Error generating AI draft:', error);
                          alert('Terjadi kesalahan saat membuat draft dengan AI.');
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating || !meta.judul}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                    >
                      {isGenerating ? 'AI Berpikir...' : 'Generate Tab 2 & 3 dari Data Saat Ini'}
                    </button>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Identitas & KOP SOP</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Institusi</label>
                  <input type="text" name="institusi" value={meta.institusi} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Fakultas / Unit Kerja</label>
                  <input type="text" name="unit" value={meta.unit} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Judul SOP</label>
                  <input type="text" name="judul" value={meta.judul} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Nomor Dokumen</label>
                  <input type="text" name="nomor" value={meta.nomor} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal Terbit</label>
                  <input type="text" name="tanggal" value={meta.tanggal} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Revisi Ke-</label>
                  <input type="text" name="revisi" value={meta.revisi} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Halaman</label>
                  <input type="text" name="halaman" value={meta.halaman} onChange={handleMetaChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Isi Pendahuluan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">1. Tujuan</label>
                  <textarea name="tujuan" value={meta.tujuan} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">2. Ruang Lingkup</label>
                  <textarea name="ruangLingkup" value={meta.ruangLingkup} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">3. Ringkasan</label>
                  <textarea name="ringkasan" value={meta.ringkasan} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">4. Definisi (Glossary)</label>
                  <textarea name="definisi" value={meta.definisi} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">5. Landasan Hukum</label>
                  <textarea name="landasanHukum" value={meta.landasanHukum} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">6. Keterkaitan</label>
                  <textarea name="keterkaitan" value={meta.keterkaitan} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">7. Kualifikasi Pelaksana</label>
                  <textarea name="kualifikasiPelaksana" value={meta.kualifikasiPelaksana} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">8. Perlengkapan</label>
                  <textarea name="perlengkapan" value={meta.perlengkapan} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">9. Peringatan / Resiko</label>
                  <textarea name="peringatanResiko" value={meta.peringatanResiko} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">10. Formulir</label>
                  <textarea name="formulir" value={meta.formulir} onChange={handleMetaChange} rows={3} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setActiveTab('actors')} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition">Selanjutnya: Pelaksana ➔</button>
              </div>
            </div>
          )}

          {/* TAB 2: ACTORS */}
          {activeTab === 'actors' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border print:hidden">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-800">Daftar Pelaksana (Aktor/Unit)</h2>
                <button onClick={addActor} className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-200">
                  <Plus size={16} /> Tambah Pelaksana
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Pelaksana ini akan menjadi kolom-kolom (swimlanes) pada flowchart.</p>
              
              <div className="space-y-3">
                {actors.map((actor, idx) => (
                  <div key={actor.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded border">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <input 
                      type="text" 
                      value={actor.name}
                      onChange={(e) => updateActor(actor.id, e.target.value)}
                      className="flex-1 border-gray-300 border rounded px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Nama Pelaksana (Misal: Mahasiswa, Dosen, Kaprodi...)"
                    />
                    <button onClick={() => removeActor(actor.id)} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Hapus">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {actors.length === 0 && <p className="text-center text-gray-400 py-4">Belum ada pelaksana. Tambahkan minimal satu.</p>}
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setActiveTab('meta')} className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg transition">🡠 Kembali</button>
                <button onClick={() => setActiveTab('steps')} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition">Selanjutnya: Prosedur ➔</button>
              </div>
            </div>
          )}

          {/* TAB 3: STEPS */}
          {activeTab === 'steps' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border print:hidden">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-800">Prosedur & Generator Flowchart</h2>
                <button onClick={addStep} className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-200">
                  <Plus size={16} /> Tambah Langkah
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Urutkan langkah-langkah di bawah ini. Garis panah flowchart akan digambar otomatis secara berurutan.</p>

              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-4 items-start relative group">
                    {/* Urutan & Kontrol */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center font-bold text-sm mb-1">
                        {idx + 1}
                      </div>
                      <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={16}/></button>
                      <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={16}/></button>
                    </div>

                    {/* Form Input */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">No.</label>
                        <input 
                          type="text" value={step.no} onChange={(e) => updateStep(step.id, 'no', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="1 / 1.1"
                        />
                      </div>
                      <div className="md:col-span-10">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Deskripsi Kegiatan</label>
                        <textarea 
                          value={step.text} 
                          onChange={(e) => updateStep(step.id, 'text', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Pelaksana (Aktor)</label>
                        <select 
                          value={step.actorId} 
                          onChange={(e) => updateStep(step.id, 'actorId', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white"
                        >
                          {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Bentuk (Simbol)</label>
                        <select 
                          value={step.shape} 
                          onChange={(e) => updateStep(step.id, 'shape', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white"
                        >
                          <option value="start">Mulai</option>
                          <option value="process">Proses</option>
                          <option value="decision">Keputusan</option>
                          <option value="document">Dokumen</option>
                          <option value="end">Selesai</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Waktu</label>
                        <input 
                          type="text" value={step.waktu} onChange={(e) => updateStep(step.id, 'waktu', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Misal: 10 mnt"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Kelengkapan</label>
                        <input 
                          type="text" value={step.kelengkapan} onChange={(e) => updateStep(step.id, 'kelengkapan', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Misal: Dokumen"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 font-semibold uppercase mb-1 block">Output</label>
                        <input 
                          type="text" value={step.output} onChange={(e) => updateStep(step.id, 'output', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Misal: Dokumen A"
                        />
                      </div>
                    </div>

                    {/* Hapus */}
                    <button onClick={() => removeStep(step.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition" title="Hapus Langkah">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {steps.length === 0 && <p className="text-center text-gray-400 py-8 border-2 border-dashed rounded-lg">Belum ada langkah prosedur.</p>}
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setActiveTab('actors')} className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg transition">🡠 Kembali</button>
                <button onClick={() => setActiveTab('preview')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Lihat Hasil Akhir ➔</button>
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW / CETAK PDF */}
          <div className={`${activeTab === 'preview' ? 'block' : 'hidden print:block'}`}>
            
            {/* INSTRUCTION BEFORE PRINT */}
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 flex justify-between items-center print:hidden border border-blue-200">
              <div>
                <h3 className="font-bold">Dokumen Siap Dicetak</h3>
                <p className="text-sm">Tampilan di bawah ini adalah pratinjau kertas A4. Klik tombol di kanan untuk menyimpan sebagai PDF.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  const blob = await generateDocx(meta, actors, steps);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `SOP_${meta.judul || 'Draft'}.docx`;
                  a.click();
                  URL.revokeObjectURL(url);
                }} className="bg-white text-blue-700 border border-blue-300 px-5 py-2 rounded shadow-sm hover:bg-blue-50 flex items-center gap-2">
                  <FileDown size={18} /> Word (.docx)
                </button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                  <Printer size={18} /> Cetak / PDF
                </button>
              </div>
            </div>

            {/* A4 DOCUMENT CONTAINER */}
            <div className="bg-white mx-auto shadow-xl print:shadow-none print:m-0" 
                 style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm', boxSizing: 'border-box' }}>
              
              {/* KOP DOKUMEN (Header Tabel) */}
              <table className="w-full border-collapse border-2 border-black mb-6 text-sm">
                <tbody>
                  <tr>
                    {/* Logo Area */}
                    <td className="border-2 border-black w-1/4 p-4 text-center align-middle" rowSpan={4}>
                      <div className="w-20 h-20 border-2 border-gray-400 border-dashed rounded-full flex items-center justify-center mx-auto mb-2 bg-gray-50">
                        <span className="text-xs text-gray-400">LOGO</span>
                      </div>
                      <div className="font-bold text-[11px] leading-tight uppercase">{meta.institusi}</div>
                      <div className="text-[10px] uppercase">{meta.unit}</div>
                    </td>
                    {/* Judul Area */}
                    <td className="border-2 border-black w-2/4 p-2 text-center align-middle" rowSpan={4}>
                      <div className="font-bold text-lg uppercase tracking-wide">STANDAR OPERASIONAL PROSEDUR</div>
                      <div className="font-bold text-base mt-2 text-blue-900 uppercase">{meta.judul}</div>
                    </td>
                    {/* Info Area */}
                    <td className="border border-black p-1.5 px-3 font-semibold bg-gray-50 w-1/4">No. Dokumen</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 px-3 text-xs">{meta.nomor}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 px-3 font-semibold bg-gray-50">Tgl. Terbit & Revisi</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 px-3 text-xs">{meta.tanggal} (Rev. {meta.revisi})</td>
                  </tr>
                </tbody>
              </table>

              {/* BODY DOKUMEN */}
              <div className="text-sm space-y-4 mb-6 leading-relaxed">
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">1. Tujuan</h3>
                  <p className="text-justify whitespace-pre-line">{meta.tujuan}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">2. Ruang Lingkup</h3>
                  <p className="text-justify whitespace-pre-line">{meta.ruangLingkup}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">3. Ringkasan</h3>
                  <p className="text-justify whitespace-pre-line">{meta.ringkasan}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">4. Definisi</h3>
                  <p className="text-justify whitespace-pre-line">{meta.definisi}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">5. Landasan Hukum</h3>
                  <p className="text-justify whitespace-pre-line">{meta.landasanHukum}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">6. Keterkaitan</h3>
                  <p className="text-justify whitespace-pre-line">{meta.keterkaitan}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">7. Kualifikasi Pelaksana</h3>
                  <p className="text-justify whitespace-pre-line">{meta.kualifikasiPelaksana}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">8. Perlengkapan</h3>
                  <p className="text-justify whitespace-pre-line">{meta.perlengkapan}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">9. Peringatan / Resiko</h3>
                  <p className="text-justify whitespace-pre-line">{meta.peringatanResiko}</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-1">10. Formulir</h3>
                  <p className="text-justify whitespace-pre-line">{meta.formulir}</p>
                </div>
              </div>

              {/* FLOWCHART SECTION */}
              <div className="mt-8 break-before-auto">
                <h3 className="font-bold uppercase border-b-2 border-black inline-block mb-4 text-sm">11. Prosedur & Diagram Alir</h3>
                
                {/* Flowchart Diagram Generator */}
                <div className="w-full overflow-hidden border border-gray-300">
                  <FlowchartRenderer steps={steps} actors={actors} />
                </div>
              </div>

              {/* SIGNATURE AREA (Optional Footer) */}
              <div className="mt-16 flex justify-end text-sm print:break-inside-avoid">
                <div className="text-center w-64">
                  <p className="mb-16">Disahkan Oleh,<br/><b>Dekan / Pimpinan Unit</b></p>
                  <p className="font-bold underline">(.................................................)</p>
                  <p>NIP. ........................................</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ==========================================
// KOMPONEN RENDERER FLOWCHART (SVG MAPPER)
// ==========================================
const FlowchartRenderer = ({ steps, actors }: { steps: any[], actors: any[] }) => {
  // Pengaturan Dimensi
  const width = 800;
  const colWidth = width / (actors.length || 1);
  const rowHeight = 110;
  const nodeWidth = 100;
  const nodeHeight = 50;
  
  // Hitung total tinggi SVG
  const headerHeight = 40;
  const height = headerHeight + (steps.length * rowHeight) + 20;

  // Fungsi utilitas untuk koordinat tengah
  const getX = (actorId: number) => {
    const actorIndex = actors.findIndex(a => a.id === actorId);
    if (actorIndex === -1) return colWidth / 2; // Fallback
    return (actorIndex * colWidth) + (colWidth / 2);
  };

  const getY = (stepIndex: number) => {
    return headerHeight + (stepIndex * rowHeight) + (rowHeight / 2);
  };

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-auto bg-white font-sans"
      style={{ maxWidth: '100%', display: 'block' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#1f2937" />
        </marker>
        <style>
          {`
            .node-text { font-size: 10px; font-family: sans-serif; text-align: center; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 4px; box-sizing: border-box; line-height: 1.1; }
            .header-text { font-size: 12px; font-weight: bold; font-family: sans-serif; }
            .side-text { font-size: 10px; fill: #4b5563; font-family: sans-serif; }
          `}
        </style>
      </defs>

      {/* 1. GAMBAR GRID & HEADER (SWIMLANES) */}
      {/* Garis Header Bawah */}
      <line x1="0" y1={headerHeight} x2={width} y2={headerHeight} stroke="#cbd5e1" strokeWidth="2" />
      
      {actors.map((actor, idx) => {
        const xPos = idx * colWidth;
        return (
          <g key={`col-${actor.id}`}>
            {/* Teks Header Actor */}
            <text x={xPos + (colWidth/2)} y={headerHeight / 1.5} textAnchor="middle" className="header-text" fill="#1e293b">
              {actor.name}
            </text>
            {/* Garis Vertikal Pemisah antar Actor */}
            {idx > 0 && (
              <line x1={xPos} y1="0" x2={xPos} y2={height} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
            )}
          </g>
        );
      })}

      {/* Garis Horizontal Pemisah antar Row/Step */}
      {steps.map((_, idx) => (
        <line 
          key={`row-${idx}`}
          x1="0" y1={headerHeight + ((idx + 1) * rowHeight)} 
          x2={width} y2={headerHeight + ((idx + 1) * rowHeight)} 
          stroke="#f1f5f9" strokeWidth="1" 
        />
      ))}

      {/* 2. GAMBAR GARIS PENGHUBUNG (PATHS) */}
      {steps.map((step, idx) => {
        if (idx === steps.length - 1) return null; // Node terakhir tidak punya panah ke bawah
        
        const nextStep = steps[idx + 1];
        const startX = getX(step.actorId);
        const startY = getY(idx) + (nodeHeight / 2);
        const endX = getX(nextStep.actorId);
        const endY = getY(idx + 1) - (nodeHeight / 2) - 4; // -4 untuk spacing arrowhead

        // Logika Routing Panah
        let pathD = '';
        if (startX === endX) {
          // Garis lurus ke bawah (Satu aktor yang sama)
          pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
          // Garis berbelok (Pindah aktor)
          const midY = startY + 25; // Turun sedikit lalu belok
          pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
        }

        return (
          <path 
            key={`path-${step.id}`} 
            d={pathD} 
            fill="none" 
            stroke="#1f2937" 
            strokeWidth="1.5" 
            markerEnd="url(#arrowhead)" 
          />
        );
      })}

      {/* 3. GAMBAR BENTUK / SHAPES & TEKS */}
      {steps.map((step, idx) => {
        const x = getX(step.actorId);
        const y = getY(idx);
        const hWidth = nodeWidth / 2;
        const hHeight = nodeHeight / 2;

        let ShapeElement = null;

        // Render Bentuk Berdasarkan Tipe
        switch (step.shape) {
          case 'start':
          case 'end':
            ShapeElement = <rect x={x - hWidth} y={y - hHeight} width={nodeWidth} height={nodeHeight} rx={hHeight} ry={hHeight} fill="white" stroke="#1f2937" strokeWidth="1.5" />;
            break;
          case 'decision':
            ShapeElement = <polygon points={`${x},${y - hHeight - 10} ${x + hWidth},${y} ${x},${y + hHeight + 10} ${x - hWidth},${y}`} fill="white" stroke="#1f2937" strokeWidth="1.5" />;
            break;
          case 'document':
            // Path dokumen dengan gelombang di bawah
            const docPath = `M ${x - hWidth} ${y - hHeight} L ${x + hWidth} ${y - hHeight} L ${x + hWidth} ${y + hHeight - 5} Q ${x + hWidth/2} ${y + hHeight + 10} ${x} ${y + hHeight - 5} Q ${x - hWidth/2} ${y + hHeight - 15} ${x - hWidth} ${y + hHeight - 5} Z`;
            ShapeElement = <path d={docPath} fill="white" stroke="#1f2937" strokeWidth="1.5" />;
            break;
          case 'process':
          default:
            ShapeElement = <rect x={x - hWidth} y={y - hHeight} width={nodeWidth} height={nodeHeight} rx="4" fill="white" stroke="#1f2937" strokeWidth="1.5" />;
            break;
        }

        return (
          <g key={`node-${step.id}`}>
            {/* Bentuk Utama */}
            {ShapeElement}
            
            {/* Nomor Step (kiri atas dari bentuk) */}
            <circle cx={x - hWidth - 15} cy={y - hHeight} r="8" fill="#1e293b" />
            <text x={x - hWidth - 15} y={y - hHeight + 3} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{step.no || (idx + 1)}</text>

            {/* Teks di dalam bentuk (Gunakan foreignObject untuk text wrapping otomatis) */}
            <foreignObject x={x - hWidth + 5} y={y - hHeight + 5} width={nodeWidth - 10} height={nodeHeight - 10}>
              <div xmlns="http://www.w3.org/1999/xhtml" className="node-text">
                {step.text.length > 40 ? step.text.substring(0, 38) + '...' : step.text}
              </div>
            </foreignObject>

            {/* Keterangan Output (Kanan luar) */}
            {(step.output && step.output !== '-') && (
              <text x={x + hWidth + 10} y={y - 5} className="side-text" fontStyle="italic">
                Out: {step.output}
              </text>
            )}
            
            {/* Keterangan Waktu (Kanan luar, bawah) */}
            {(step.waktu && step.waktu !== '-') && (
              <text x={x + hWidth + 10} y={y + 10} className="side-text" fill="#2563eb">
                ⏱ {step.waktu}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
