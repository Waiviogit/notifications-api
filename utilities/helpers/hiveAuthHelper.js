const CryptoJS = require('crypto-js');

const secretKey = process.env.HIVE_AUTH;

const decryptText = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedMessage;
  } catch (error) {
    return '';
  }
};

const validateHiveAuthToken = (token) => {
  const message = decryptText(token);
  if (!message) return;
  try {
    const result = JSON.parse(message);
    return { result: { name: result.username } };
  } catch (error) {
    return { error };
  }
};

module.exports = { validateHiveAuthToken };
