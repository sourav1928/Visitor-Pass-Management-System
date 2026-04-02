import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdPeople, MdBadge, MdCheckCircle, MdPending, MdTrendingUp, MdArrowForward } from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  'active': { label: 'Active', cls: 'badge-green' },
  'checked-in': { label: 'Checked In', cls: 'badge-green' },
  'checked-out': { label: 'Checked Out', cls: 'badge-blue' },
  'expired': { label: 'Expired', cls: 'badge-red' },
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalVisitors: 0, activePasses: 0, checkedIn: 0, pendingApprovals: 0, todayVisitors: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentPasses, setRecentPasses] = useState([]);
  const today = format(new Date(), 'EEEE, MMMM d');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          dashboardAPI.stats(),
          dashboardAPI.recentVisitors(),
        ]);
        setStats(statsRes.data);
        setRecentPasses(recentRes.data.passes || []);
        const token = localStorage.getItem('vp_token');
        const weeklyRes = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/weekly`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const weekly = await weeklyRes.json();
        setChartData(weekly.data || []);
      } catch { toast.error('Failed to load dashboard'); }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Visitors', value: stats.totalVisitors, icon: <MdPeople />, color: '#3d7fff', bg: 'rgba(61,127,255,0.12)' },
    { label: 'Active Passes', value: stats.activePasses, icon: <MdBadge />, color: '#00e5a0', bg: 'rgba(0,229,160,0.12)' },
    { label: 'Currently Inside', value: stats.checkedIn, icon: <MdCheckCircle />, color: '#00e5a0', bg: 'rgba(0,229,160,0.12)' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <MdPending />, color: '#ffb830', bg: 'rgba(255,184,48,0.12)' },
  ];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Dashboard</h1>
              <p>{today} &middot; {stats.todayVisitors} visitors today</p>
            </div>
            <Link to="/admin/visitors" className="btn btn-primary"><MdPeople /> Manage Visitors</Link>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 28 }}>
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 28 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16 }}>Weekly Visitors</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Last 7 days</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
                <MdTrendingUp /> Live data
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: 'var(--text)' }} />
                <Area type="monotone" dataKey="visitors" stroke="#00e5a0" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Issue Walk-in Pass', desc: 'Create pass for unregistered visitor', to: '/security/issue', color: 'var(--accent)' },
                { label: 'View Pending Approvals', desc: `${stats.pendingApprovals} appointments awaiting`, to: '/admin/appointments', color: 'var(--warning)' },
                { label: 'Check-In / Check-Out Logs', desc: "View today's activity", to: '/admin/logs', color: 'var(--accent-2)' },
                { label: 'Generate Report', desc: 'Export visitor data', to: '/admin/reports', color: '#9b8afb' },
              ].map((action) => (
                <Link key={action.label} to={action.to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)', transition: 'border-color 0.15s', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = action.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{action.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
                  </div>
                  <MdArrowForward style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16 }}>Recent Visitors</h3>
            <Link to="/admin/visitors" style={{ fontSize: 13, color: 'var(--accent)' }}>View all</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Host</th><th>Purpose</th><th>Issued</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentPasses.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No recent visitors</td></tr>
                ) : recentPasses.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 500 }}>{p.visitor?.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.host?.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.purpose}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{format(new Date(p.createdAt), 'dd MMM, hh:mm a')}</td>
                    <td><span className={`badge ${(STATUS_BADGE[p.status] || STATUS_BADGE['active']).cls}`}>{(STATUS_BADGE[p.status] || STATUS_BADGE['active']).label}</span></td>
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

export default AdminDashboard;
