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
