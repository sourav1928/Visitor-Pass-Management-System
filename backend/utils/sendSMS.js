const https = require('https');

const sendSMS = async (phone, message) => {
  return new Promise((resolve, reject) => {
    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.warn(`⚠️  Invalid phone number: ${phone}`);
      return resolve();
    }

    const params = new URLSearchParams({
      authorization: process.env.FAST2SMS_API_KEY,
      route: 'v3',
      sender_id: 'TXTIND',
      message: message,
      language: 'english',
      flash: '0',
      numbers: cleanPhone,
    });

    const options = {
      hostname: 'www.fast2sms.com',
      path: `/dev/bulkV2?${params.toString()}`,
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`📱 Fast2SMS response: ${body}`);
        try {
          const parsed = JSON.parse(body);
          if (parsed.return === true) {
            console.log(`✅ SMS sent to: ${cleanPhone}`);
            resolve(parsed);
          } else {
            reject(new Error(`Fast2SMS error: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Fast2SMS parse error: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('📱 SMS request error:', err.message);
      reject(err);
    });

    req.end();
  });
};

const sendInviteSMS = async ({ phone, visitorName, hostName, date, time, preRegLink }) => {
  if (!phone) return;
  const message = `Hi ${visitorName}, you have been invited to visit by ${hostName} on ${new Date(date).toLocaleDateString('en-IN')} at ${time}. Pre-register: ${preRegLink} - VisitorPass`;
  try {
    await sendSMS(phone, message);
  } catch (err) {
    console.warn('SMS invite failed (non-critical):', err.message);
  }
};

const sendApprovalSMS = async ({ phone, visitorName, hostName, date, time, passCode }) => {
  if (!phone) return;
  const message = `Hi ${visitorName}, your visit with ${hostName} on ${new Date(date).toLocaleDateString('en-IN')} at ${time} is APPROVED. Pass code: ${passCode}. Login to view QR - VisitorPass`;
  try {
    await sendSMS(phone, message);
  } catch (err) {
    console.warn('SMS approval failed (non-critical):', err.message);
  }
};

module.exports = { sendSMS, sendInviteSMS, sendApprovalSMS };