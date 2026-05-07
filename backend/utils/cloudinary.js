const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── Upload image to Cloudinary ─────────────────────────
// Accepts: file path (string) or base64 data URL or buffer
const uploadToCloudinary = (filePathOrBase64, folder = 'visitorpass') => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return reject(new Error('Cloudinary credentials not set in environment variables'));
    }

    // Generate signature
    const timestamp = Math.round(Date.now() / 1000);
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha256').update(signatureStr).digest('hex');

    // Get file data
    let fileData;
    if (typeof filePathOrBase64 === 'string' && filePathOrBase64.startsWith('data:')) {
      // Base64 data URL
      fileData = filePathOrBase64;
    } else if (typeof filePathOrBase64 === 'string' && fs.existsSync(filePathOrBase64)) {
      // File path — read as base64
      const buffer = fs.readFileSync(filePathOrBase64);
      const ext = path.extname(filePathOrBase64).slice(1) || 'jpg';
      const mimeType = ext === 'jpg' ? 'jpeg' : ext;
      fileData = `data:image/${mimeType};base64,${buffer.toString('base64')}`;
    } else if (Buffer.isBuffer(filePathOrBase64)) {
      fileData = `data:image/jpeg;base64,${filePathOrBase64.toString('base64')}`;
    } else {
      return reject(new Error('Invalid file input for Cloudinary upload'));
    }

    // Build multipart form body
    const boundary = `----CloudinaryBoundary${Date.now()}`;
    const fields = {
      file: fileData,
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
      folder,
    };

    let body = '';
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const bodyBuffer = Buffer.from(body, 'utf8');

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.secure_url) {
            console.log(`☁️  Cloudinary upload success: ${parsed.secure_url}`);
            resolve(parsed.secure_url);
          } else {
            reject(new Error(`Cloudinary error: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Cloudinary parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
};

// ── Delete image from Cloudinary ───────────────────────
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.round(Date.now() / 1000);
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha256').update(signatureStr).digest('hex');

    const boundary = `----CloudinaryBoundary${Date.now()}`;
    let body = '';
    for (const [key, value] of Object.entries({ public_id: publicId, api_key: apiKey, timestamp: String(timestamp), signature })) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const bodyBuffer = Buffer.from(body, 'utf8');
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/image/destroy`,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': bodyBuffer.length },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
