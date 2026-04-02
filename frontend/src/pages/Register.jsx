import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  MdSecurity, MdPerson, MdEmail, MdLock, MdPhone,
  MdBusiness, MdBadge, MdCheckCircle, MdArrowBack,
  MdVisibility, MdVisibilityOff
} from 'react-icons/md';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'Personal', 'Identity'];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    // Step 0 — Account
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 1 — Personal
    phone: '',
    company: '',
    address: '',
    // Step 2 — Identity
    idType: '',
    idNumber: '',
  });

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return toast.error('Name is required');
      if (!form.email.trim()) return toast.error('Email is required');
      if (!form.email.includes('@')) return toast.error('Enter a valid email');
      if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
      if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
      return true;
    }
    if (step === 1) {
      if (!form.phone.trim()) return toast.error('Phone number is required');
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        company: form.company,
        address: form.address,
        idType: form.idType,
        idNumber: form.idNumber,
        role: 'visitor', // always visitor on public register
      });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────
  if (done) return (
    <div style={pageStyle}>
      <BgGrid />
      <Glow />
      <div className="animate-fadeUp" style={{ ...cardStyle, textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(0,229,160,0.12)',
          border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, color: 'var(--accent)',
          margin: '0 auto 20px',
        }}>
          <MdCheckCircle />
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>You're registered!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
          Your visitor account has been created. You can now log in, view your passes,
          and manage your visits.
        </p>
        <button
          className="btn btn-primary"
          style={{ margin: '0 auto', justifyContent: 'center', width: '100%', height: 44 }}
          onClick={() => navigate('/login')}
        >
          Go to Login →
        </button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <BgGrid />
      <Glow />

      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52,
            background: 'rgba(0,229,160,0.12)',
            border: '1.5px solid var(--accent)',
            borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'var(--accent)',
            margin: '0 auto 12px',
          }}>
            <MdSecurity />
          </div>
          <h1 style={{ fontSize: 24, color: 'var(--text)' }}>Create Visitor Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Register to get your digital visitor pass
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i < step ? 'var(--accent)' : i === step ? 'rgba(0,229,160,0.15)' : 'var(--surface-2)',
                  border: `2px solid ${i <= step ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: i < step ? '#000' : i === step ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.3s',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 11, marginTop: 4, fontWeight: 600,
                  color: i === step ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  height: 2, flex: 1, marginBottom: 16,
                  background: i < step ? 'var(--accent)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={cardStyle}>

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div>
              <StepHeader icon={<MdPerson />} title="Account Details" subtitle="Set up your login credentials" />
              <div className="form-group">
                <label>Full Name *</label>
                <InputIcon icon={<MdPerson />}>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" />
                </InputIcon>
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <InputIcon icon={<MdEmail />}>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                </InputIcon>
              </div>
              <div className="form-group">
                <label>Password * <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(min 6 characters)</span></label>
                <InputIcon icon={<MdLock />} right={
                  <span onClick={() => setShowPassword(p => !p)} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </span>
                }>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="••••••••" />
                </InputIcon>
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <InputIcon icon={<MdLock />}>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                </InputIcon>
              </div>
            </div>
          )}

          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div>
              <StepHeader icon={<MdPhone />} title="Personal Details" subtitle="Tell us a bit about yourself" />
              <div className="form-group">
                <label>Phone Number *</label>
                <InputIcon icon={<MdPhone />}>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                </InputIcon>
              </div>
              <div className="form-group">
                <label>Company / Organization <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(optional)</span></label>
                <InputIcon icon={<MdBusiness />}>
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Your company name" />
                </InputIcon>
              </div>
              <div className="form-group">
                <label>Address <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(optional)</span></label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Your address..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Identity ── */}
          {step === 2 && (
            <div>
              <StepHeader icon={<MdBadge />} title="Identity Verification" subtitle="Required for security clearance at entry" />
              <div className="form-group">
                <label>ID Type <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(optional but recommended)</span></label>
                <select name="idType" value={form.idType} onChange={handleChange}>
                  <option value="">Select ID type</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {form.idType && (
                <div className="form-group">
                  <label>ID Number</label>
                  <InputIcon icon={<MdBadge />}>
                    <input name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="Enter your ID number" />
                  </InputIcon>
                </div>
              )}

              {/* Summary box */}
              <div style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 9, padding: '14px 16px', marginTop: 8,
              }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>
                  ACCOUNT SUMMARY
                </p>
                {[
                  { label: 'Name', value: form.name },
                  { label: 'Email', value: form.email },
                  { label: 'Phone', value: form.phone },
                  { label: 'Company', value: form.company || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {step > 0 && (
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(s => s - 1)}
                type="button"
              >
                <MdArrowBack /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', height: 44 }}
                onClick={nextStep}
                type="button"
              >
                Continue →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', height: 44 }}
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                {loading ? 'Creating account...' : '✓ Create Account'}
              </button>
            )}
          </div>
        </div>

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

// ─── Small helper components ──────────────────────────────────

const StepHeader = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <div style={{
      width: 38, height: 38, borderRadius: 9,
      background: 'var(--accent-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--accent)', fontSize: 20,
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: 15 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>{subtitle}</p>
    </div>
  </div>
);

const InputIcon = ({ icon, children, right }) => (
  <div style={{ position: 'relative' }}>
    <span style={{
      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
      color: 'var(--text-muted)', fontSize: 18, pointerEvents: 'none',
    }}>
      {icon}
    </span>
    {/* Clone child input with paddingLeft */}
    {React.cloneElement(children, { style: { paddingLeft: 36, paddingRight: right ? 36 : 14 } })}
    {right && (
      <span style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
      }}>
        {right}
      </span>
    )}
  </div>
);

const BgGrid = () => (
  <div style={{
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
    backgroundSize: '48px 48px', opacity: 0.3, pointerEvents: 'none',
  }} />
);

const Glow = () => (
  <div style={{
    position: 'absolute',
    width: 500, height: 500,
    background: 'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  }} />
);

// ─── Styles ───────────────────────────────────────────────────
const pageStyle = {
  minHeight: '100vh',
  background: 'var(--bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 24px',
  position: 'relative',
  overflow: 'hidden',
};

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '28px 28px',
};

import React from 'react';
export default Register;
