const multer = require('multer')

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
  'video/matroska',
  'video/x-matroska',
  // Images (for thumbnails)
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

const fileFilter = (req, file, cb) => {
  const normalizedMimeType = file.mimetype === 'video/matroska' ? 'video/x-matroska' : file.mimetype

  if (ALLOWED_MIME_TYPES.includes(normalizedMimeType)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false)
  }
}

// memoryStorage keeps the file in RAM as a Buffer
// We pipe that buffer directly to MinIO — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})

module.exports = upload