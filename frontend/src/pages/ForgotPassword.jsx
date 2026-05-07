import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MdSecurity, MdEmail, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.3 }} />
      <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-dim)', border: '1.5px solid var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: 'var(--accent)', margin: '0 auto 14px' }}>
            <MdSecurity />
          </div>
          <h1 style={{ fontSize: 24 }}>Forgot Password?</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>No worries — we'll send you a reset link</p>
        </div>

        <div className="card">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <MdCheckCircle style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Check your email!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                We've sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
              </p>
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>← Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 17, marginBottom: 4 }}>Reset Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <MdEmail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ paddingLeft: 36 }} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 4 }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Remember your password? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
