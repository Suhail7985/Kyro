import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadRoot = path.join(process.cwd(), 'uploads');
const resumeDir = path.join(uploadRoot, 'resumes');
const videoDir = path.join(uploadRoot, 'videos');
const docsDir = path.join(uploadRoot, 'documents');

[resumeDir, videoDir, docsDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const memory = multer.memoryStorage();

export const resumeUpload = multer({
  storage: memory,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(
        file.mimetype
      ) || /\.(pdf|docx)$/i.test(file.originalname);
    cb(null, ok);
  },
});

export const bulkResumeUpload = multer({
  storage: memory,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
});

export const videoUpload = multer({
  dest: videoDir,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const documentUpload = multer({
  dest: docsDir,
  limits: { fileSize: 10 * 1024 * 1024 },
});
