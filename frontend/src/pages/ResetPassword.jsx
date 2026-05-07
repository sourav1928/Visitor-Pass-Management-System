import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MdSecurity, MdLock, MdCheckCircle, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
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

      <div className="animate-fadeUp" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-dim)', border: '1.5px solid var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: 'var(--accent)', margin: '0 auto 14px' }}>
            <MdSecurity />
          </div>
          <h1 style={{ fontSize: 24 }}>Set New Password</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>Enter your new password below</p>
        </div>

        <div className="card">
          {done ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <MdCheckCircle style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Password Reset!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Your password has been reset successfully. Redirecting to login...
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 17, marginBottom: 4 }}>Create New Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Must be at least 6 characters.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <MdLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      style={{ paddingLeft: 36, paddingRight: 36 }}
                      required
                    />
                    <span onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <MdLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }} />
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Repeat new password"
                      style={{ paddingLeft: 36 }}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 44 }} disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
