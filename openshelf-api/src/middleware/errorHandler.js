import multer from 'multer';
import { errorsTotal } from '../config/metrics.js';

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer file size exceeded
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 500 MB.' });
    }
    return res.status(400).json({ message: err.message });
  }

  // Blocked file type (thrown by fileFilter)
  if (err.message?.startsWith('File type not allowed')) {
    return res.status(400).json({ message: err.message });
  }

  // Prisma unique constraint
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'A record with this value already exists' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const type = status >= 500 ? 'http_5xx' : status >= 400 ? 'http_4xx' : 'http_other';
  errorsTotal.inc({ type });

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
