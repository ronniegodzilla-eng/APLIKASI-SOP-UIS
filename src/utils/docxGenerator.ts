import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } from 'docx';

export const generateDocx = async (meta: any, actors: any[], steps: any[]) => {
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
  };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: meta.institusi || "UNIVERSITAS IBNU SINA",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `PROSEDUR: ${meta.judul}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Nomor SOP: ${meta.nomor || '-'}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Tanggal: ${meta.tanggal || new Date().toLocaleDateString('id-ID')}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Tabel Pengesahan
          new Paragraph({ text: "PENGESAHAN", heading: HeadingLevel.HEADING_3 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Proses", alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Nama", alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Jabatan", alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Tanda Tangan", alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Tanggal", alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                ],
              }),
              ...["1. Perumusan", "2. Pemeriksaan", "3. Persetujuan", "4. Penetapan"].map(proses => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(proses)] }),
                    new TableCell({ children: [new Paragraph("")] }),
                    new TableCell({ children: [new Paragraph("")] }),
                    new TableCell({ children: [new Paragraph("")] }),
                    new TableCell({ children: [new Paragraph("")] }),
                  ],
                })
              )
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Konten SOP
          new Paragraph({ text: "1. TUJUAN", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: meta.tujuan || "-" }),
          
          new Paragraph({ text: "2. RUANG LINGKUP", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.ruangLingkup || "-" }),

          new Paragraph({ text: "3. RINGKASAN", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.ringkasan || "-" }),

          new Paragraph({ text: "4. DEFINISI ISTILAH", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.definisi || "-" }),

          new Paragraph({ text: "5. LANDASAN HUKUM", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.landasanHukum || "-" }),

          new Paragraph({ text: "6. KETERKAITAN", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.keterkaitan || "-" }),

          new Paragraph({ text: "7. KUALIFIKASI PELAKSANA", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.kualifikasiPelaksana || "-" }),

          new Paragraph({ text: "8. PERLENGKAPAN", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.perlengkapan || "-" }),

          new Paragraph({ text: "9. PERINGATAN / RESIKO", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.peringatanResiko || "-" }),

          new Paragraph({ text: "10. FORMULIR", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
          new Paragraph({ text: meta.formulir || "-" }),

          new Paragraph({ text: "11. URAIAN PROSEDUR", heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "No", alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Kegiatan", alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Pelaksana", alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Waktu", alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Kelengkapan", alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ text: "Output", alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                ],
              }),
              ...steps.map((item: any, idx: number) => {
                const actor = actors.find(a => a.id === item.actorId);
                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: item.no || String(idx + 1), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph(item.text || "-")] }),
                    new TableCell({ children: [new Paragraph(actor ? actor.name : "-")] }),
                    new TableCell({ children: [new Paragraph(item.waktu || "-")] }),
                    new TableCell({ children: [new Paragraph(item.kelengkapan || "-")] }),
                    new TableCell({ children: [new Paragraph(item.output || "-")] }),
                  ],
                });
              })
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};
