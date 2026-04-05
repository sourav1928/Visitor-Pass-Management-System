const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email transporter ready');
  } catch (err) {
    console.warn('⚠️  Email transporter not ready:', err.message);
  }
};

verifyTransporter();

// ─── Send appointment invite ───────────────────────────
const sendAppointmentInvite = async ({ to, visitorName, hostName, date, time, purpose, preRegLink }) => {
  const transporter = createTransporter();

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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
};

// ─── Send approval confirmation ────────────────────────
const sendApprovalEmail = async ({ to, visitorName, hostName, date, time }) => {
  const transporter = createTransporter();

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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
          <p>Please log in to your VisitorPass account to view your QR code pass.</p>
          <a href="${process.env.FRONTEND_URL}/visitor" style="display: inline-block; background: #00e5a0; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
            View My Pass →
          </a>
        </div>
      </div>
    `,
  });
};

module.exports = { sendAppointmentInvite, sendApprovalEmail };
