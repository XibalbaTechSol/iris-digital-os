/**
 * IRIS Digital OS - Security Middleware (Task 1.3)
 * Logic: AES-256 Field-Level Encryption for PII/PHI.
 */

const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.PII_ENCRYPTION_KEY || 'development_secret_do_not_use_in_prod';

/**
 * Encrypts a string (e.g., SSN, MCI) for storage.
 */
const encryptField = (data) => {
    if (!data) return null;
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Decrypts a string for display in secure UI.
 */
const decryptField = (ciphertext) => {
    if (!ciphertext) return null;
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = {
    encryptField,
    decryptField
};
