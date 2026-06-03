import multer from 'multer';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const storage = multer.memoryStorage(); // we hash+rename before persisting

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(ApiError.badRequest('Only PDF files are allowed'));
  }
  if (!/\.pdf$/i.test(file.originalname)) {
    return cb(ApiError.badRequest('Only .pdf files are allowed'));
  }
  cb(null, true);
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 1 },
});

export { uploadPdf };
