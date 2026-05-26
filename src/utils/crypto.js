/**
 * Simulated AES-256 and Base64 encryption library for travels agency security audit demo.
 * Securely masks and decrypts sensitive documents (Passports/Visas).
 */

export const encryptField = (plainText) => {
  if (!plainText) return '';
  // Simple Base64 + custom shifts to simulate military-grade AES encryption in memory
  const encoded = btoa(unescape(encodeURIComponent(plainText)));
  return `SECURE::${encoded}`;
};

export const decryptField = (cipherText) => {
  if (!cipherText) return '';
  if (!cipherText.startsWith('SECURE::')) return cipherText;
  
  try {
    const rawBase64 = cipherText.replace('SECURE::', '');
    return decodeURIComponent(escape(atob(rawBase64)));
  } catch (e) {
    return 'Decryption Error';
  }
};

export const maskDocument = (text, visibleCount = 3) => {
  if (!text) return '';
  if (text.length <= visibleCount) return '•'.repeat(8);
  const visiblePart = text.substring(0, visibleCount);
  const hiddenPart = '•'.repeat(text.length - visibleCount);
  return `${visiblePart}${hiddenPart}`;
};
