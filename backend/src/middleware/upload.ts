import multer from 'multer';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are accepted'));
      return;
    }
    cb(null, true);
  },
});
