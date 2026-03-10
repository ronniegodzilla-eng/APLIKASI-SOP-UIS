import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import { google } from "googleapis";
import stream from "stream";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  const upload = multer({ storage: multer.memoryStorage() });

  // API routes FIRST
  app.post("/api/upload-gdrive", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File tidak ditemukan" });
      }

      const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
      const privateKey = process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      // Jika kredensial tidak ada, kembalikan link dummy agar aplikasi tidak crash
      if (!clientEmail || !privateKey) {
        console.warn("Kredensial Google Drive tidak ditemukan. Mengembalikan link dummy.");
        return res.json({ link: "https://docs.google.com/document/d/dummy-link-karena-kredensial-kosong/edit" });
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const drive = google.drive({ version: "v3", auth });
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      const response = await drive.files.create({
        requestBody: {
          name: req.file.originalname,
          mimeType: req.file.mimetype,
        },
        media: {
          mimeType: req.file.mimetype,
          body: bufferStream,
        },
        fields: "id, webViewLink",
      });

      // Set permission to anyone with link can view
      if (response.data.id) {
        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      }

      res.json({ link: response.data.webViewLink });
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      res.status(500).json({ error: "Gagal mengunggah ke Google Drive" });
    }
  });



  app.post("/api/generate-sop", async (req, res) => {
    try {
      const { deskripsi, namaSop, unitKerja } = req.body;

      if (!deskripsi) {
        return res.status(400).json({ error: "Deskripsi SOP diperlukan" });
      }

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi" });
      }
      
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
      const ai = new GoogleGenAI({ AIzaSyBuWJk9uNqnyhpqYTLM1jP6gaJEd5idooo });

      const systemInstruction = `Anda adalah asisten ahli penjaminan mutu di Universitas Ibnu Sina. Tugas Anda adalah membuat draft Standar Operasional Prosedur (SOP) berdasarkan deskripsi pengguna. Output harus berformat JSON dengan struktur berikut, sesuai pedoman resmi:
{
"tujuan": "Tujuan SOP",
"ruang_lingkup": "Batasan dan kondisi",
"ringkasan": "Ringkasan prosedur",
"definisi": "Definisi istilah terkait",
"landasan_hukum": "Aturan yang berlaku",
"keterkaitan": "Keterkaitan dengan proses bisnis/SOP lain",
"kualifikasi_pelaksana": "Kompetensi yang dibutuhkan",
"mutu_baku": [{"indikator": "", "standar": "", "instrumen": ""}],
"perlengkapan": "Peralatan/sistem informasi",
"peringatan_resiko": "Dampak jika tidak dijalankan dan solusinya",
"formulir": "Formulir yang digunakan",
"uraian_prosedur": [{"no": "", "kegiatan": "", "pelaksana": "", "kelengkapan": "", "output": ""}],
"mermaid_chart": "Kode Mermaid.js bertipe flowchart TD atau LR dengan swimlane untuk memvisualisasikan uraian prosedur"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Buatkan draft SOP untuk:\nNama SOP: ${namaSop || 'Belum ditentukan'}\nUnit Kerja: ${unitKerja || 'Belum ditentukan'}\nDeskripsi: ${deskripsi}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tujuan: { type: Type.STRING },
              ruang_lingkup: { type: Type.STRING },
              ringkasan: { type: Type.STRING },
              definisi: { type: Type.STRING },
              landasan_hukum: { type: Type.STRING },
              keterkaitan: { type: Type.STRING },
              kualifikasi_pelaksana: { type: Type.STRING },
              mutu_baku: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    indikator: { type: Type.STRING },
                    standar: { type: Type.STRING },
                    instrumen: { type: Type.STRING }
                  }
                }
              },
              perlengkapan: { type: Type.STRING },
              peringatan_resiko: { type: Type.STRING },
              formulir: { type: Type.STRING },
              uraian_prosedur: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    no: { type: Type.STRING },
                    kegiatan: { type: Type.STRING },
                    pelaksana: { type: Type.STRING },
                    waktu: { type: Type.STRING },
                    kelengkapan: { type: Type.STRING },
                    output: { type: Type.STRING }
                  }
                }
              },
              mermaid_chart: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error("Error generating SOP:", error);
      res.status(500).json({ error: "Gagal menghasilkan draft SOP" });
    }
  });

  app.post("/api/complete-sop", async (req, res) => {
    try {
      const { meta } = req.body;

      if (!meta || !meta.judul) {
        return res.status(400).json({ error: "Data SOP tidak lengkap" });
      }

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi" });
      }
      
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `Anda adalah asisten ahli penjaminan mutu di Universitas Ibnu Sina. Tugas Anda adalah melengkapi draft Standar Operasional Prosedur (SOP) berdasarkan data yang sudah ada. Output harus berformat JSON dengan struktur berikut:
{
"tujuan": "Tujuan SOP",
"ruang_lingkup": "Batasan dan kondisi",
"ringkasan": "Ringkasan prosedur",
"definisi": "Definisi istilah terkait",
"landasan_hukum": "Aturan yang berlaku",
"keterkaitan": "Keterkaitan dengan proses bisnis/SOP lain",
"kualifikasi_pelaksana": "Kompetensi yang dibutuhkan",
"mutu_baku": [{"indikator": "", "standar": "", "instrumen": ""}],
"perlengkapan": "Peralatan/sistem informasi",
"peringatan_resiko": "Dampak jika tidak dijalankan dan solusinya",
"formulir": "Formulir yang digunakan",
"uraian_prosedur": [{"no": "", "kegiatan": "", "pelaksana": "", "kelengkapan": "", "output": ""}],
"mermaid_chart": "Kode Mermaid.js bertipe flowchart TD atau LR dengan swimlane untuk memvisualisasikan uraian prosedur"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Lengkapi draft SOP ini:\nNama SOP: ${meta.judul}\nUnit Kerja: ${meta.unit}\nTujuan: ${meta.tujuan}\nRuang Lingkup: ${meta.ruangLingkup}\nRingkasan: ${meta.ringkasan}\nDefinisi: ${meta.definisi}\nLandasan Hukum: ${meta.landasanHukum}\nKeterkaitan: ${meta.keterkaitan}\nKualifikasi Pelaksana: ${meta.kualifikasiPelaksana}\nPerlengkapan: ${meta.perlengkapan}\nPeringatan/Resiko: ${meta.peringatanResiko}\nFormulir: ${meta.formulir}\n\nTolong buatkan uraian prosedur (langkah-langkah) dan pelaksana (aktor) yang sesuai dengan informasi di atas.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tujuan: { type: Type.STRING },
              ruang_lingkup: { type: Type.STRING },
              ringkasan: { type: Type.STRING },
              definisi: { type: Type.STRING },
              landasan_hukum: { type: Type.STRING },
              keterkaitan: { type: Type.STRING },
              kualifikasi_pelaksana: { type: Type.STRING },
              mutu_baku: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    indikator: { type: Type.STRING },
                    standar: { type: Type.STRING },
                    instrumen: { type: Type.STRING }
                  }
                }
              },
              perlengkapan: { type: Type.STRING },
              peringatan_resiko: { type: Type.STRING },
              formulir: { type: Type.STRING },
              uraian_prosedur: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    no: { type: Type.STRING },
                    kegiatan: { type: Type.STRING },
                    pelaksana: { type: Type.STRING },
                    waktu: { type: Type.STRING },
                    kelengkapan: { type: Type.STRING },
                    output: { type: Type.STRING }
                  }
                }
              },
              mermaid_chart: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error("Error completing SOP:", error);
      res.status(500).json({ error: "Gagal melengkapi draft SOP" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
