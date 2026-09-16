const crypto = require('crypto');
const { Pengaturan } = require('../models');

const ALGORITHM = 'aes-256-gcm';

function encryptionKey() {
  return crypto
    .createHash('sha256')
    .update(process.env.GEMINI_SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET || 'change-this-secret')
    .digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

function decrypt(value) {
  try {
    const [ivEncoded, tagEncoded, encryptedEncoded] = String(value).split('.');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      encryptionKey(),
      Buffer.from(ivEncoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch (err) {
    throw new Error('API key Gemini tersimpan tetapi tidak dapat dibuka. Periksa kunci enkripsi backend.');
  }
}

async function getGeminiConfig() {
  const setting = await Pengaturan.findByPk(1, {
    attributes: ['gemini_api_key_encrypted', 'gemini_model'],
  });
  return {
    apiKey: setting?.gemini_api_key_encrypted
      ? decrypt(setting.gemini_api_key_encrypted)
      : process.env.GEMINI_API_KEY || '',
    model: setting?.gemini_model || process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    source: setting?.gemini_api_key_encrypted ? 'database' : (process.env.GEMINI_API_KEY ? 'env' : 'none'),
  };
}

module.exports = { encrypt, getGeminiConfig };
