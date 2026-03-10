import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePdf = (meta: any, actors: any[], steps: any[]): Blob => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(meta.institusi || 'UNIVERSITAS IBNU SINA', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`PROSEDUR: ${meta.judul}`, 105, 30, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor SOP: ${meta.nomor || '-'}`, 105, 38, { align: 'center' });
  doc.text(`Tanggal: ${meta.tanggal || new Date().toLocaleDateString('id-ID')}`, 105, 44, { align: 'center' });

  // Tabel Pengesahan
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PENGESAHAN', 14, 55);

  autoTable(doc, {
    startY: 60,
    head: [['Proses', 'Nama', 'Jabatan', 'Tanda Tangan', 'Tanggal']],
    body: [
      ['1. Perumusan', '', '', '', ''],
      ['2. Pemeriksaan', '', '', '', ''],
      ['3. Persetujuan', '', '', '', ''],
      ['4. Penetapan', '', '', '', ''],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [10, 92, 54], textColor: 255, halign: 'center' },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  const addSection = (title: string, content: string) => {
    if (finalY > 270) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, 14, finalY);
    finalY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(content || '-', 180);
    doc.text(splitText, 14, finalY);
    finalY += (splitText.length * 5) + 5;
  };

  addSection('1. TUJUAN', meta.tujuan);
  addSection('2. RUANG LINGKUP', meta.ruangLingkup);
  addSection('3. RINGKASAN', meta.ringkasan);
  addSection('4. DEFINISI ISTILAH', meta.definisi);
  addSection('5. LANDASAN HUKUM', meta.landasanHukum);
  addSection('6. KETERKAITAN', meta.keterkaitan);
  addSection('7. KUALIFIKASI PELAKSANA', meta.kualifikasiPelaksana);
  addSection('8. PERLENGKAPAN', meta.perlengkapan);
  addSection('9. PERINGATAN / RESIKO', meta.peringatanResiko);
  addSection('10. FORMULIR', meta.formulir);

  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('11. URAIAN PROSEDUR', 14, finalY);

  const tableData = steps.map((item: any, idx: number) => {
    const actor = actors.find(a => a.id === item.actorId);
    return [
      item.no || String(idx + 1),
      item.text || '-',
      actor ? actor.name : '-',
      item.waktu || '-',
      item.kelengkapan || '-',
      item.output || '-'
    ];
  });

  autoTable(doc, {
    startY: finalY + 5,
    head: [['No', 'Kegiatan', 'Pelaksana', 'Waktu', 'Kelengkapan', 'Output']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [10, 92, 54], textColor: 255, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    }
  });

  return doc.output('blob');
};
