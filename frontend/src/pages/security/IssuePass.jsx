import { useState } from 'react';
import { visitorAPI, passAPI, userAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdBadge, MdSearch, MdCheckCircle, MdDownload, MdPersonAdd } from 'react-icons/md';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

const IssuePass = () => {
  const [step, setStep] = useState(0); // 0=find/create visitor, 1=pass details, 2=issued
  const [searchEmail, setSearchEmail] = useState('');
  const [visitor, setVisitor] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [issuedPass, setIssuedPass] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newVisitor, setNewVisitor] = useState({ name: '', email: '', phone: '', company: '' });
  const [showNewForm, setShowNewForm] = useState(false);

  const [passForm, setPassForm] = useState({
    hostId: '', purpose: 'meeting', floor: '', room: '',
    validHours: '8',
  });

  // Search visitor by email
  const searchVisitor = async () => {
    if (!searchEmail.trim()) return;
    setLoading(true);
    try {
      const res = await visitorAPI.getAll({ search: searchEmail });
      const found = res.data.visitors.find(v => v.email.toLowerCase() === searchEmail.toLowerCase());
      if (found) {
        setVisitor(found);
        loadHosts();
        setStep(1);
      } else {
        toast('Visitor not found. Create a new one below.', { icon: '🔍' });
        setShowNewForm(true);
        setNewVisitor(p => ({ ...p, email: searchEmail }));
      }
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const loadHosts = async () => {
    try {
      const res = await userAPI.getAll({ role: 'employee' });
      setHosts(res.data.users);
    } catch {}
  };

  const createAndProceed = async () => {
    if (!newVisitor.name || !newVisitor.email) return toast.error('Name and email required');
    setLoading(true);
    try {
      const res = await visitorAPI.create(newVisitor);
      setVisitor(res.data.visitor);
      setShowNewForm(false);
      loadHosts();
      setStep(1);
      toast.success('Visitor created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create visitor');
    } finally { setLoading(false); }
  };

  const issuePass = async () => {
    if (!passForm.hostId) return toast.error('Please select a host');
    setLoading(true);
    try {
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + Number(passForm.validHours));

      const res = await passAPI.issue({
        visitorId: visitor._id,
        hostId: passForm.hostId,
        purpose: passForm.purpose,
        validFrom: new Date(),
        validUntil,
        floor: passForm.floor,
        room: passForm.room,
      });
      setIssuedPass(res.data.pass);
      setStep(2);
      toast.success('Pass issued successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue pass');
    } finally { setLoading(false); }
  };

  const downloadPDF = async () => {
    try {
      const res = await passAPI.downloadPDF(issuedPass._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `pass-${issuedPass.passCode}.pdf`;
      a.click();
    } catch { toast.error('PDF download failed'); }
  };

  const reset = () => {
    setStep(0); setVisitor(null); setIssuedPass(null);
    setSearchEmail(''); setShowNewForm(false);
    setPassForm({ hostId: '', purpose: 'meeting', floor: '', room: '', validHours: '8' });
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Issue Walk-in Pass</h1>
          <p>Issue a visitor pass for someone arriving without a prior appointment.</p>
        </div>

        {/* Step 0 — Find or create visitor */}
        {step === 0 && (
          <div style={{ maxWidth: 560 }}>
            <div className="card animate-fadeUp" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Step 1 — Find Visitor</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                  placeholder="Enter visitor's email address..."
                  onKeyDown={e => e.key === 'Enter' && searchVisitor()}
                  style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={searchVisitor} disabled={loading}>
                  <MdSearch /> {loading ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {showNewForm && (
              <div className="card animate-fadeUp">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <MdPersonAdd style={{ color: 'var(--accent)', fontSize: 22 }} />
                  <div>
                    <h3 style={{ fontSize: 15 }}>Register New Visitor</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Visitor not found — fill in their details</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Full Name *</label><input value={newVisitor.name} onChange={e => setNewVisitor(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" /></div>
                  <div className="form-group"><label>Email *</label><input value={newVisitor.email} onChange={e => setNewVisitor(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Phone</label><input value={newVisitor.phone} onChange={e => setNewVisitor(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
                  <div className="form-group"><label>Company</label><input value={newVisitor.company} onChange={e => setNewVisitor(p => ({ ...p, company: e.target.value }))} placeholder="Company" /></div>
                </div>
                <button className="btn btn-primary" onClick={createAndProceed} disabled={loading}>
                  {loading ? 'Creating...' : 'Create & Continue →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Pass details */}
        {step === 1 && visitor && (
          <div style={{ maxWidth: 560 }}>
            {/* Visitor info */}
            <div className="card animate-fadeUp" style={{ marginBottom: 16, border: '1px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>✓ Visitor Found</div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{visitor.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{visitor.email} · {visitor.company || 'No company'}</div>
                </div>
                <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setStep(0); setVisitor(null); }}>Change</button>
              </div>
            </div>

            <div className="card animate-fadeUp">
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Step 2 — Pass Details</h3>
              <div className="form-group">
                <label>Host / Meeting With *</label>
                <select value={passForm.hostId} onChange={e => setPassForm(p => ({ ...p, hostId: e.target.value }))}>
                  <option value="">Select employee...</option>
                  {hosts.map(h => <option key={h._id} value={h._id}>{h.name} {h.department ? `— ${h.department}` : ''}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Purpose</label>
                  <select value={passForm.purpose} onChange={e => setPassForm(p => ({ ...p, purpose: e.target.value }))}>
                    <option value="meeting">Meeting</option>
                    <option value="interview">Interview</option>
                    <option value="vendor">Vendor</option>
                    <option value="delivery">Delivery</option>
                    <option value="client">Client Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Valid For</label>
                  <select value={passForm.validHours} onChange={e => setPassForm(p => ({ ...p, validHours: e.target.value }))}>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="8">8 hours (full day)</option>
                    <option value="24">24 hours</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Floor</label><input value={passForm.floor} onChange={e => setPassForm(p => ({ ...p, floor: e.target.value }))} placeholder="e.g. 4th Floor" /></div>
                <div className="form-group"><label>Room</label><input value={passForm.room} onChange={e => setPassForm(p => ({ ...p, room: e.target.value }))} placeholder="e.g. Conference Room B" /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>Back</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={issuePass} disabled={loading}>
                  <MdBadge /> {loading ? 'Issuing...' : 'Issue Pass'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Issued! */}
        {step === 2 && issuedPass && (
          <div style={{ maxWidth: 420 }}>
            <div className="card animate-fadeUp" style={{ textAlign: 'center', border: '1px solid var(--accent)' }}>
              <MdCheckCircle style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 12 }} />
              <h2 style={{ fontSize: 20, marginBottom: 4 }}>Pass Issued!</h2>
              <code style={{ color: 'var(--accent)', fontSize: 14, background: 'var(--accent-dim)', padding: '4px 12px', borderRadius: 6 }}>
                {issuedPass.passCode}
              </code>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <div style={{ background: '#fff', padding: 14, borderRadius: 10 }}>
                  <QRCodeSVG value={`VPMS:${issuedPass.passCode}`} size={140} />
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Show this QR code to the visitor. They can also download the PDF badge.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadPDF}><MdDownload /> PDF</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>Issue Another</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuePass;
