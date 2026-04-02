const QRCode = require('qrcode');

// Returns a base64 PNG data URL of the QR code
const generateQR = async (data) => {
  try {
    const qrBase64 = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
    });
    return qrBase64;
  } catch (err) {
    throw new Error(`QR generation failed: ${err.message}`);
  }
};

module.exports = generateQR;
