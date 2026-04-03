import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdSecurity, MdEmail, MdLock } from 'react-icons/md';
import toast from 'react-hot-toast';

const ROLE_REDIRECT = {
  admin: '/admin',
  security: '/security',
  employee: '/employee',
  visitor: '/visitor',
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(ROLE_REDIRECT[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.3,
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fadeUp" style={{
        width: '100%', maxWidth: 420,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60,
            background: 'var(--accent-dim)',
            border: '1.5px solid var(--accent)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'var(--accent)',
            margin: '0 auto 16px',
          }}>
            <MdSecurity />
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--text)' }}>VisitorPass</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
            Visitor Management System
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Sign in</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <div style={{ position: 'relative' }}>
                <MdEmail style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 18,
                }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <MdLock style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 18,
                }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, height: 44 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            New visitor?{' '}
            <a href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Create an account →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;