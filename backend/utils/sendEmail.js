const https = require('https');

const sendBrevoEmail = ({ to, subject, html, fromName, fromEmail }) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: { name: fromName || 'VisitorPass', email: fromEmail || process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`📧 Brevo response: ${res.statusCode} ${body}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Brevo API error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('📧 Brevo request error:', err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

const verifyTransporter = async () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY not set — emails will not send');
    return;
  }
  console.log('✅ Brevo API email ready');
};

verifyTransporter();

// ─── Send appointment invite ───────────────────────────
const sendAppointmentInvite = async ({ to, visitorName, hostName, date, time, purpose, preRegLink }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  console.log(`📧 Sending invite email to: ${to}`);

  await sendBrevoEmail({
    to,
    subject: `You've been invited to visit — ${hostName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
        <div style="background: #00e5a0; padding: 24px; text-align: center;">
          <h1 style="color: #000; margin: 0; font-size: 22px;">VisitorPass</h1>
          <p style="color: #000; margin: 4px 0 0; font-size: 13px;">Visitor Management System</p>
        </div>
        <div style="padding: 28px;">
          <h2 style="color: #111; font-size: 18px;">Hello ${visitorName},</h2>
          <p style="color: #444;">You have been invited to visit by <strong>${hostName}</strong>.</p>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr><td style="padding: 6px 0; color: #888;">Date</td><td><strong>${formattedDate}</strong></td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Time</td><td><strong>${time}</strong></td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Purpose</td><td><strong>${purpose}</strong></td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Host</td><td><strong>${hostName}</strong></td></tr>
            </table>
          </div>
          <p style="color: #444;">Please complete your pre-registration to receive your digital visitor pass:</p>
          <a href="${preRegLink}" style="display: inline-block; background: #00e5a0; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 8px 0;">
            Complete Pre-Registration →
          </a>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">
            This link is unique to you. Please do not share it.<br>
            If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  console.log(`✅ Invite email sent to: ${to}`);
};

// ─── Send approval confirmation ────────────────────────
const sendApprovalEmail = async ({ to, visitorName, hostName, date, time, tempPassword, passCode }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  console.log(`📧 Sending approval email to: ${to}`);

  const credentialsBlock = tempPassword ? `
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #856404;">🔑 Your Login Credentials</p>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td style="padding: 4px 0; color: #666;">Email</td><td><strong>${to}</strong></td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Password</td><td><strong style="font-family: monospace; font-size: 16px;">${tempPassword}</strong></td></tr>
      </table>
      <p style="margin: 10px 0 0; font-size: 12px; color: #856404;">⚠️ Please change your password after first login.</p>
    </div>
  ` : '';

  const passBlock = passCode ? `
    <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #155724; font-weight: 600; text-transform: uppercase;">Your Pass Code</p>
      <p style="margin: 0; font-family: monospace; font-size: 20px; font-weight: bold; color: #155724; letter-spacing: 2px;">${passCode}</p>
    </div>
  ` : '';

  await sendBrevoEmail({
    to,
    subject: 'Your visit has been approved ✓',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <div style="background: #00e5a0; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #000; margin: 0;">Visit Approved ✓</h1>
        </div>
        <div style="padding: 28px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
          <p>Hi <strong>${visitorName}</strong>,</p>
          <p>Your appointment with <strong>${hostName}</strong> on <strong>${formattedDate} at ${time}</strong> has been approved.</p>
          ${passBlock}
          ${credentialsBlock}
          <p>Log in to your VisitorPass account to view your QR code pass:</p>
          <a href="${process.env.FRONTEND_URL}/visitor" style="display: inline-block; background: #00e5a0; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
            View My Pass →
          </a>
        </div>
      </div>
    `,
  });

  console.log(`✅ Approval email sent to: ${to}`);
};

module.exports = { sendAppointmentInvite, sendApprovalEmail };