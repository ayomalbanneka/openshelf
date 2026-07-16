import multer from 'multer';

const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  // Images (for thumbnails)
  'image/jpeg',
  'image/png',
  'image/webp',
];

// Human-readable label for error messages
const ALLOWED_TYPES_LABEL =
  'PDF, Word, EPUB, MP3, WAV, OGG, MP4, MOV, AVI, MKV, JPEG, PNG, or WebP';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

/*
 * Multer file filter to validate uploaded files against allowed MIME types.
 * Special handling for Matroska files due to inconsistent MIME types across platforms.
 * If the file type is not allowed, an error with status 400 is returned.
 */
const fileFilter = (req, file, cb) => {
  const normalized = file.mimetype === 'video/matroska' ? 'video/x-matroska' : file.mimetype;

  if (ALLOWED_MIME_TYPES.includes(normalized)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error(`File type not allowed. Accepted types: ${ALLOWED_TYPES_LABEL}`), {
        status: 400,
      }),
      false
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
