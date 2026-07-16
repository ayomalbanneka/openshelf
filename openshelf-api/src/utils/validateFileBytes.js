import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Validates a file buffer against its actual magic bytes.
 * Throws a 400 error if the content doesn't match an allowed type.
 *
 * @param {Buffer} buffer   - The file buffer from multer memoryStorage
 * @param {string} fieldname - Used in the error message (e.g. 'file', 'thumbnail')
 */
const validateFileBytes = async (buffer, fieldname = 'file') => {
  const detected = await fileTypeFromBuffer(buffer);

  // file-type returns undefined for formats it can't identify
  // (e.g. plain text, some XML-based formats)
  if (!detected) {
    throw Object.assign(
      new Error(
        `Could not verify file type for "${fieldname}". Please upload a supported file format.`
      ),
      { status: 400 }
    );
  }

  // Normalise matroska — file-type returns 'video/x-matroska'
  const mime = detected.mime === 'video/matroska' ? 'video/x-matroska' : detected.mime;

  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw Object.assign(
      new Error(`Invalid file content for "${fieldname}": detected ${detected.mime}`),
      { status: 400 }
    );
  }
};

export { validateFileBytes };
