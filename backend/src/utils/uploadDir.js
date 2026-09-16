const fs = require('fs');
const path = require('path');

const configuredDir = process.env.UPLOAD_DIR || 'uploads';
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', path.basename(configuredDir))
  : path.isAbsolute(configuredDir)
    ? configuredDir
    : path.join(__dirname, '..', '..', configuredDir);

function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

module.exports = { uploadDir, ensureUploadDir };
