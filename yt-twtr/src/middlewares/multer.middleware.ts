import multer from "multer";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "./public/temp";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, uploadDir);
  },
  filename: function (_, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (_, file, cb) => {
    // Accept images and videos
    const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    const videoRegex = /\.(mp4|avi|mov|mkv|webm|flv)$/i;
    
    if (imageRegex.test(file.originalname) || videoRegex.test(file.originalname)) {
      cb(null, true); // Accept file
    } else {
      cb(null, false); // Don't accept file
    }
  },
});

export default upload;
