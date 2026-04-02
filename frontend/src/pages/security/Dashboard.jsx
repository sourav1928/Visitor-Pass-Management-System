import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkLogAPI, passAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdQrCodeScanner, MdBadge, MdCheckCircle, MdPeople, MdHistory } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SecurityDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ checkedIn: 0, todayIns: 0, todayOuts: 0, activePasses: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [logsRes, passesRes] = await Promise.all([
          checkLogAPI.getAll({ limit: 8 }),
          passAPI.getAll({ status: 'checked-in', limit: 100 }),
        ]);
        const logs = logsRes.data.logs || [];
        const today = new Date().toDateString();
        const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
        setRecentLogs(logs);
        setStats({
          checkedIn: passesRes.data.passes?.length || 0,
          todayIns: todayLogs.filter(l => l.action === 'check-in').length,
          todayOuts: todayLogs.filter(l => l.action === 'check-out').length,
          activePasses: passesRes.data.total || 0,
        });
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Security Dashboard</h1>
          <p>Welcome, {user?.name}. Here's today's activity at a glance.</p>
        </div>

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Currently Inside', value: stats.checkedIn, icon: <MdPeople />, color: '#00e5a0', bg: 'rgba(0,229,160,0.12)' },
            { label: "Today's Check-Ins", value: stats.todayIns, icon: <MdCheckCircle />, color: '#3d7fff', bg: 'rgba(61,127,255,0.12)' },
            { label: "Today's Check-Outs", value: stats.todayOuts, icon: <MdHistory />, color: '#ffb830', bg: 'rgba(255,184,48,0.12)' },
            { label: 'Active Passes', value: stats.activePasses, icon: <MdBadge />, color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-info"><h3>{loading ? '—' : s.value}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          <Link to="/security/scan" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 28, flexShrink: 0 }}>
                <MdQrCodeScanner />
              </div>
              <div>
                <h3 style={{ fontSize: 16 }}>Scan QR Code</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Open camera to scan a visitor pass for check-in or check-out</p>
              </div>
            </div>
          </Link>

          <Link to="/security/issue" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3d7fff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: 'rgba(61,127,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d7fff', fontSize: 28, flexShrink: 0 }}>
                <MdBadge />
              </div>
              <div>
                <h3 style={{ fontSize: 16 }}>Issue Walk-in Pass</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Create a pass for a visitor arriving without an appointment</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16 }}>Recent Activity</h3>
            <Link to="/security/logs" style={{ fontSize: 13, color: 'var(--accent)' }}>View all logs →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Action</th><th>Visitor</th><th>Pass Code</th><th>Time</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Loading...</td></tr>
                ) : recentLogs.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No activity today</td></tr>
                ) : recentLogs.map(log => (
                  <tr key={log._id}>
                    <td>
                      <span className={`badge ${log.action === 'check-in' ? 'badge-green' : 'badge-blue'}`}>
                        {log.action === 'check-in' ? '↓ Check-In' : '↑ Check-Out'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.visitor?.name}</td>
                    <td><code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 5 }}>{log.pass?.passCode}</code></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{format(new Date(log.timestamp), 'hh:mm a')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
