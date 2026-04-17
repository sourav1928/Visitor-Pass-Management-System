import { useState } from 'react';
import { appointmentAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdPersonAdd, MdSend, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';

const InviteVisitor = () => {
  const [form, setForm] = useState({
    visitorName: '', visitorEmail: '', visitorPhone: '',
    purpose: '', date: '', time: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await appointmentAPI.create(form);
      setSuccess(true);
      toast.success('Invitation sent! Visitor will receive an email and SMS.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="layout">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card animate-fadeUp" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent-dim)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: 'var(--accent)', margin: '0 auto 16px',
          }}>
            <MdCheckCircle />
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Invitation Sent!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            <strong>{form.visitorName}</strong> will receive an email and SMS with a pre-registration link and appointment details.
          </p>
          <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => { setSuccess(false); setForm({ visitorName: '', visitorEmail: '', visitorPhone: '', purpose: '', date: '', time: '', notes: '' }); }}>
            Invite Another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Invite a Visitor</h1>
          <p>Send a pre-registration invite to your guest. They'll get an email and SMS with a digital pass.</p>
        </div>

        <div style={{ maxWidth: 600 }}>
          <div className="card animate-fadeUp">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 20 }}>
                <MdPersonAdd />
              </div>
              <div>
                <h3 style={{ fontSize: 15 }}>Visitor Details</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Fill in your guest's information</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="visitorName" value={form.visitorName} onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input name="visitorEmail" type="email" value={form.visitorEmail} onChange={handleChange} placeholder="john@company.com" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input name="visitorPhone" type="tel" value={form.visitorPhone} onChange={handleChange} placeholder="+91 98765 43210" required />
                </div>
                <div className="form-group">
                  <label>Purpose of Visit *</label>
                  <select name="purpose" value={form.purpose} onChange={handleChange} required>
                    <option value="">Select purpose</option>
                    <option value="meeting">Meeting</option>
                    <option value="interview">Interview</option>
                    <option value="vendor">Vendor / Supplier</option>
                    <option value="delivery">Delivery</option>
                    <option value="client">Client Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Visit Date *</label>
                  <input name="date" type="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Expected Time *</label>
                  <input name="time" type="time" value={form.time} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any special instructions or notes for security..."
                  rows={3}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: 8 }}>
                  <MdSend /> {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>

          {/* Info box */}
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: 'var(--accent-dim)', border: '1px solid rgba(0,229,160,0.2)',
            borderRadius: 9, fontSize: 13, color: 'var(--text-soft)',
          }}>
            💡 The visitor will receive an email and SMS with a pre-registration link. Once they complete it, a QR code pass is generated automatically.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteVisitor;
