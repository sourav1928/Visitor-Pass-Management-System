const PDFDocument = require('pdfkit');

// Generates a PDF visitor badge and returns a stream
const generatePDF = async (pass) => {
  const doc = new PDFDocument({ size: [300, 420], margin: 0 });

  const visitor = pass.visitor;
  const host = pass.host;

  // ─── Background ───────────────────────────────────────
  // Header band
  doc.rect(0, 0, 300, 100).fill('#00e5a0');

  // Body
  doc.rect(0, 100, 300, 320).fill('#ffffff');

  // ─── Header Text ──────────────────────────────────────
  doc.fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('VISITOR PASS', 20, 20, { align: 'center', width: 260 });

  doc.fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(visitor?.company || 'VisitorPass', 20, 40, { align: 'center', width: 260 });

  // ─── Pass Code ────────────────────────────────────────
  doc.fillColor('#333333')
    .font('Helvetica')
    .fontSize(9)
    .text(pass.passCode, 20, 108, { align: 'center', width: 260 });

  // ─── QR Code ──────────────────────────────────────────
  if (pass.qrCode) {
    // qrCode is a base64 data URL — extract the base64 part
    const base64Data = pass.qrCode.split(',')[1];
    const imgBuffer = Buffer.from(base64Data, 'base64');
    doc.image(imgBuffer, 75, 125, { width: 150, height: 150 });
  }

  // ─── Visitor Name ─────────────────────────────────────
  doc.fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(visitor?.name || 'Visitor', 20, 290, { align: 'center', width: 260 });

  // ─── Details ──────────────────────────────────────────
  const detailY = 315;
  const lineHeight = 18;

  const details = [
    { label: 'Host', value: host?.name || '—' },
    { label: 'Purpose', value: pass.purpose || '—' },
    { label: 'Valid Until', value: new Date(pass.validUntil).toLocaleString() },
  ];

  if (pass.floor) details.push({ label: 'Floor/Room', value: `${pass.floor}${pass.room ? ' · ' + pass.room : ''}` });

  details.forEach((d, i) => {
    doc.fillColor('#888888').font('Helvetica').fontSize(8)
      .text(d.label.toUpperCase(), 20, detailY + i * lineHeight, { width: 80 });
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9)
      .text(d.value, 100, detailY + i * lineHeight, { width: 180 });
  });

  // ─── Footer ───────────────────────────────────────────
  doc.rect(0, 395, 300, 25).fill('#111318');
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8)
    .text('Present this pass at the security gate with valid photo ID', 10, 402, { align: 'center', width: 280 });

  doc.end();
  return doc;
};

module.exports = generatePDF;
