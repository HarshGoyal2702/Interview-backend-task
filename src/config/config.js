export const CONFIG = {
  PORT: process.env.PORT || 3001,
  GOOGLE_SHEETS_WEBHOOK_URL: process?.env?.URL,
  VAPID: {
    publicKey: process.env.publicKey,
    privateKey: process.env.privateKey,
    email: process.env.mailTo,
  },
  CIPHER_KEY: process.env.cipherKey,
};