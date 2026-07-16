import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3, BUCKET, PUBLIC_URL } from '../config/storage.js';
import path from 'path'; // For handling file paths
import crypto from 'crypto'; // For generating random file names

const uploadFile = async (file, folder = 'uploads') => {
  // Generate a unique filename — never trust the original filename

  const ext = path.extname(file.originalname).toLowerCase(); // Get file extension
  const uniqueId = crypto.randomBytes(16).toString('hex'); // Generate a random string
  const key = `${folder}/${uniqueId}${ext}`; // Combine folder, unique ID, and extension

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer, // The file content as a buffer
      ContentType: file.mimetype, // Set the correct MIME type
    })
  );

  // Return the public URL so it can be stored in the database
  return `${PUBLIC_URL}/${key}`;
};

const deleteFile = async (fileUrl) => {
  try {
    // Extract the key from the full URL
    const key = fileUrl.replace(`${PUBLIC_URL}/`, '');

    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    // Log but don't throw — a failed file deletion shouldn't crash the request
    console.error('Storage deletion failed:', err.message);
  }
};

export { uploadFile, deleteFile };
