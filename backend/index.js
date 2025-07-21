const BASE_UPLOAD_DIR = "D:/Shohan/backup_images";
const PORT = 4001;

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

app.listen(PORT, () =>
  console.log(`Server running at http://192.168.0.101:${PORT}`)
);
