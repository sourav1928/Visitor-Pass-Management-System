import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MdBadge, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';

const PreRegister = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', idType: '', idNumber: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setLoading(true);
    try {
      await api.post(`/appointments/pre-register/${token}`, form);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. The link may be invalid or expired.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card animate-fadeUp" style={{ maxWidth: 420, textAlign: 'center' }}>
        <MdCheckCircle style={{ fontSize: 56, color: 'var(--accent)', marginBottom: 16 }} />
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>You're all set!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Your pre-registration is complete. Your visitor pass QR code will be sent to your email once approved.
        </p>
        <button className="btn btn-primary" style={{ margin: '0 auto', justifyContent: 'center', width: '100%' }} onClick={() => navigate('/login')}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'var(--accent-dim)', border: '1.5px solid var(--accent)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: 'var(--accent)', margin: '0 auto 12px' }}>
            <MdBadge />
          </div>
          <h1 style={{ fontSize: 22 }}>Pre-Registration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Complete your details to receive your visitor pass</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
              <div className="form-group"><label>Company</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Your company" /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ID Type</label>
                <select value={form.idType} onChange={e => setForm(p => ({ ...p, idType: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>
              <div className="form-group"><label>ID Number</label><input value={form.idNumber} onChange={e => setForm(p => ({ ...p, idNumber: e.target.value }))} placeholder="ID number" /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 8 }} disabled={loading}>
              {loading ? 'Submitting...' : 'Complete Pre-Registration →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PreRegister;
