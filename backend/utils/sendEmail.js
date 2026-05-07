const https = require('https');

const sendBrevoEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: { name: 'VisitorPass', email: process.env.BREVO_SENDER_EMAIL },
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
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Error(`Brevo API error: ${res.statusCode} ${body}`));
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
          <p style="color: #444;">Please complete your pre-registration:</p>
          <a href="${preRegLink}" style="display: inline-block; background: #00e5a0; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 8px 0;">
            Complete Pre-Registration →
          </a>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">This link is unique to you. Please do not share it.</p>
        </div>
      </div>
    `,
  });

  console.log(`✅ Invite email sent to: ${to}`);
};

// ─── Send pass email with QR code + credentials ────────
const sendApprovalEmail = async ({ to, visitorName, hostName, date, time, tempPassword, passCode, qrCode, validFrom, validUntil, purpose, floor, room, loginUrl }) => {
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formattedValidFrom = validFrom ? new Date(validFrom).toLocaleString('en-IN') : formattedDate;
  const formattedValidUntil = validUntil ? new Date(validUntil).toLocaleString('en-IN') : '';

  console.log(`📧 Sending pass email to: ${to}`);

  // ✅ Always show login section
  const credentialsBlock = tempPassword ? `
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #856404;">🔑 Your Login Credentials</p>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td style="padding: 4px 0; color: #666; width: 80px;">Email</td><td><strong>${to}</strong></td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Password</td><td><strong style="font-family: monospace; font-size: 18px; letter-spacing: 2px; color: #d63031;">${tempPassword}</strong></td></tr>
      </table>
      <p style="margin: 10px 0 0; font-size: 12px; color: #856404;">⚠️ Please change your password after first login for security.</p>
    </div>
  ` : `
    <div style="background: #e8f4fd; border: 1px solid #3d7fff; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: bold; color: #1a56db;">🔑 Login to View Your Pass</p>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td style="padding: 4px 0; color: #666; width: 80px;">Email</td><td><strong>${to}</strong></td></tr>
        <tr><td style="padding: 4px 0; color: #666;">Password</td><td><strong>Use your existing password</strong></td></tr>
      </table>
    </div>
  `;

  // QR code as embedded image
  const qrBlock = qrCode ? `
    <div style="text-align: center; margin: 20px 0;">
      <p style="margin: 0 0 10px; font-size: 13px; color: #555; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your QR Code Pass</p>
      <img src="${qrCode}" alt="QR Code" style="width: 180px; height: 180px; border: 3px solid #00e5a0; border-radius: 12px; padding: 8px; background: #fff;" />
      <p style="margin: 8px 0 0; font-family: monospace; font-size: 13px; color: #888; letter-spacing: 1px;">${passCode}</p>
    </div>
  ` : `
    <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #155724; font-weight: 600; text-transform: uppercase;">Your Pass Code</p>
      <p style="margin: 0; font-family: monospace; font-size: 22px; font-weight: bold; color: #155724; letter-spacing: 3px;">${passCode}</p>
    </div>
  `;

  const locationBlock = (floor || room) ? `
    <p style="margin: 4px 0; color: #555; font-size: 14px;">📍 <strong>Report to:</strong> ${[floor, room].filter(Boolean).join(' · ')}</p>
  ` : '';

  await sendBrevoEmail({
    to,
    subject: '🎫 Your Visitor Pass is Ready — ' + passCode,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #00e5a0, #00c98a); padding: 24px; text-align: center;">
          <h1 style="color: #000; margin: 0; font-size: 22px;">VisitorPass</h1>
          <p style="color: rgba(0,0,0,0.6); margin: 4px 0 0; font-size: 13px;">Visitor Management System</p>
        </div>

        <div style="padding: 28px;">
          <h2 style="color: #111; font-size: 20px; margin: 0 0 4px;">Hi ${visitorName}! 👋</h2>
          <p style="color: #444; margin: 0 0 20px;">Your visitor pass has been issued. Show the QR code at the security gate.</p>

          ${qrBlock}

          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr><td style="padding: 5px 0; color: #888; width: 100px;">Host</td><td><strong>${hostName}</strong></td></tr>
              <tr><td style="padding: 5px 0; color: #888;">Purpose</td><td><strong style="text-transform: capitalize;">${purpose || '—'}</strong></td></tr>
              <tr><td style="padding: 5px 0; color: #888;">Date</td><td><strong>${formattedDate}</strong></td></tr>
              <tr><td style="padding: 5px 0; color: #888;">Time</td><td><strong>${time}</strong></td></tr>
              <tr><td style="padding: 5px 0; color: #888;">Valid From</td><td><strong>${formattedValidFrom}</strong></td></tr>
              <tr><td style="padding: 5px 0; color: #888;">Valid Until</td><td><strong>${formattedValidUntil}</strong></td></tr>
            </table>
            ${locationBlock}
          </div>

          ${credentialsBlock}

          <div style="text-align: center; margin-top: 20px;">
            <a href="${loginUrl || process.env.FRONTEND_URL + '/visitor'}" style="display: inline-block; background: #00e5a0; color: #000; font-weight: bold; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">
              View My Pass →
            </a>
          </div>

          <p style="color: #aaa; font-size: 11px; margin-top: 20px; text-align: center;">
            Please carry a valid photo ID. This pass is valid only for the date and time shown above.
          </p>
        </div>
      </div>
    `,
  });

  console.log(`✅ Pass email sent to: ${to}`);
};

// ─── Forgot password email ─────────────────────────────
const sendPasswordResetEmail = async ({ to, name, resetLink }) => {
  console.log(`📧 Sending password reset email to: ${to}`);

  await sendBrevoEmail({
    to,
    subject: 'Reset Your VisitorPass Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; background: #f9f9f9; border-radius: 10px; overflow: hidden;">
        <div style="background: #00e5a0; padding: 24px; text-align: center;">
          <h1 style="color: #000; margin: 0; font-size: 22px;">VisitorPass</h1>
        </div>
        <div style="padding: 28px;">
          <h2 style="color: #111; font-size: 18px;">Hi ${name},</h2>
          <p style="color: #444;">We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #00e5a0; color: #000; font-weight: bold; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
              Reset Password →
            </a>
          </div>
          <p style="color: #888; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.</p>
        </div>
      </div>
    `,
  });

  console.log(`✅ Reset email sent to: ${to}`);
};

module.exports = { sendAppointmentInvite, sendApprovalEmail, sendPasswordResetEmail };
