const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = process.env.CNP_ENCRYPTION_KEY;
const ivLength = 16;
if (!key || key.length !== 32) {
  throw new Error('CNP_ENCRYPTION_KEY must be set in .env and be exactly 32 characters!');
}

function encryptCNP(cnp) {
  if (!cnp) return null;
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
  let encrypted = cipher.update(cnp, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptCNP(encrypted) {
  if (!encrypted) return null;
  const [ivHex, encryptedCNP] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
  let decrypted = decipher.update(encryptedCNP, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encryptCNP, decryptCNP };
