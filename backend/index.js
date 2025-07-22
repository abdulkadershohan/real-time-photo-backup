const dotenv = require("dotenv");
dotenv.config();

const BASE_UPLOAD_DIR =
  process.env.BASE_UPLOAD_DIR || "D:/Shohan/backup_images";
const PORT = process.env.PORT || 4001;

const express = require("express");

const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

// Upload endpoint
app.post("/upload", upload.array("photos"), (req, res) => {
  const dir = req.body.dir?.trim();

  if (!dir) {
    return res.status(400).json({ message: "Directory not provided" });
  }

  const targetDir = path.join(BASE_UPLOAD_DIR, dir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    req.files.forEach((file) => {
      const filePath = path.join(targetDir, file.originalname);
      fs.writeFileSync(filePath, file.buffer);
    });

    res.status(200).json({ message: "Files uploaded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving files", error: err });
  }
});

// ✅ New endpoint: Get list of photos from given directory
app.get("/photos", (req, res) => {
  const dir = req.query.dir?.trim();

  if (!dir) {
    return res.status(400).json({ message: "Directory not provided" });
  }

  const targetDir = path.join(BASE_UPLOAD_DIR, dir);

  if (!fs.existsSync(targetDir)) {
    return res.status(404).json({ message: "Directory not found" });
  }

  try {
    const files = fs.readdirSync(targetDir);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)
    );

    res.status(200).json({ files: imageFiles });
  } catch (err) {
    res.status(500).json({ message: "Error reading directory", error: err });
  }
});

// Serve images with proper CORS headers
app.get("/files/:dir/:filename", (req, res) => {
  const { dir, filename } = req.params;
  const filePath = path.join(BASE_UPLOAD_DIR, dir, filename);
  console.log(`Serving file: ${filePath}`);
  console.log(`Directory: ${dir}, Filename: ${filename}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Set CORS headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // Set content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);

  // Send file
  res.sendFile(filePath);
});

// Download endpoint with attachment headers
app.get("/download/:dir/:filename", (req, res) => {
  const { dir, filename } = req.params;
  const filePath = path.join(BASE_UPLOAD_DIR, dir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  // Set headers for download
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Disposition", `attachment; filename="${filename}"`);
  res.header("Content-Type", "application/octet-stream");

  res.sendFile(filePath);
});

app.listen(PORT, () =>
  console.log(`Server running at http://192.168.0.101:${PORT}`)
);
