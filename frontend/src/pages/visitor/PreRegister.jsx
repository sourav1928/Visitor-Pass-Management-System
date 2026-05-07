import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdBadge, MdCheckCircle, MdPerson, MdEmail,
  MdPhone, MdBusiness, MdLock, MdCameraAlt,
  MdVisibility, MdVisibilityOff
} from 'react-icons/md';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PreRegister = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    address: '', idType: '', idNumber: '',
    password: '', confirmPassword: '',
  });

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be less than 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!form.phone) return toast.error('Phone number is required');
    if (!form.idType) return toast.error('Please select an ID type');
    if (!form.idNumber) return toast.error('ID number is required');
    if (!form.password || form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('company', form.company);
      formData.append('address', form.address);
      formData.append('idType', form.idType);
      formData.append('idNumber', form.idNumber);
      formData.append('password', form.password);
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch(`${API_BASE}/appointments/pre-register/${token}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setDone(true);
    } catch (err) {
      toast.error(err.message || 'Registration failed. The link may be invalid or expired.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div style={pageStyle}>
      <BgGrid />
      <div className="card animate-fadeUp" style={{ maxWidth: 440, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <MdCheckCircle style={{ fontSize: 64, color: 'var(--accent)', marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Registration Complete! 🎉</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
          Your visitor pass has been generated and sent to your email.
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>
          Check your inbox for your QR code pass and login credentials.
        </p>
        <button className="btn btn-primary" style={{ margin: '0 auto', justifyContent: 'center', width: '100%', height: 44 }} onClick={() => navigate('/login')}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <BgGrid />
      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: 540, position: 'relative', zIndex: 1, padding: '20px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-dim)', border: '1.5px solid var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'var(--accent)', margin: '0 auto 12px' }}>
            <MdBadge />
          </div>
          <h1 style={{ fontSize: 24 }}>Complete Your Registration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
            Fill in your details to receive your visitor pass with QR code
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Photo Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Your photo" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--surface-2)', border: '3px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdPerson style={{ fontSize: 44, color: 'var(--text-muted)' }} />
                  </div>
                )}
                <label htmlFor="photo-input" style={{ position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg)' }}>
                  <MdCameraAlt style={{ fontSize: 15, color: '#000' }} />
                </label>
                <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Upload your photo <span style={{ color: 'var(--accent)' }}>(recommended for security verification)</span>
              </p>
            </div>

            {/* Personal Info */}
            <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Personal Details</div>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <MdPerson style={iconStyle} />
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" style={{ paddingLeft: 36 }} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <MdEmail style={iconStyle} />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" style={{ paddingLeft: 36 }} required />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <MdPhone style={iconStyle} />
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" style={{ paddingLeft: 36 }} required />
                </div>
              </div>
              <div className="form-group">
                <label>Company / Organization</label>
                <div style={{ position: 'relative' }}>
                  <MdBusiness style={iconStyle} />
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Your company" style={{ paddingLeft: 36 }} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="Your address..." rows={2} />
            </div>

            {/* ID Verification */}
            <div style={{ marginBottom: 8, marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identity Verification</div>
            <div className="form-row">
              <div className="form-group">
                <label>ID Type *</label>
                <select name="idType" value={form.idType} onChange={handleChange} required>
                  <option value="">Select ID type</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>ID Number *</label>
                <div style={{ position: 'relative' }}>
                  <MdBadge style={iconStyle} />
                  <input name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="Enter ID number" style={{ paddingLeft: 36 }} required />
                </div>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8, marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Create Your Password</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>You'll use this to log in and view your pass anytime.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <div style={{ position: 'relative' }}>
                  <MdLock style={iconStyle} />
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min 6 characters" style={{ paddingLeft: 36, paddingRight: 36 }} required />
                  <span onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <MdLock style={iconStyle} />
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" style={{ paddingLeft: 36 }} required />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text-soft)' }}>
              ✅ After submitting, your visitor pass QR code will be sent to your email immediately.
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 46 }} disabled={loading}>
              {loading ? 'Creating your pass...' : '🎫 Complete Registration & Get Pass →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const iconStyle = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18, pointerEvents: 'none' };
const pageStyle = { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' };
const BgGrid = () => (
  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.3, pointerEvents: 'none' }} />
);

export default PreRegister;
