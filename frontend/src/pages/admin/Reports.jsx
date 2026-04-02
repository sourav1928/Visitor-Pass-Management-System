import { useState, useEffect } from 'react';
import { dashboardAPI, checkLogAPI, passAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdDownload, MdBarChart, MdPeople, MdBadge } from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#00e5a0', '#3d7fff', '#ffb830', '#ff4d6d'];

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, weeklyRes] = await Promise.all([
          dashboardAPI.stats(),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/weekly`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('vp_token')}` }
          }).then(r => r.json()),
        ]);
        setStats(statsRes.data);
        setWeeklyData(weeklyRes.data || []);
      } catch { toast.error('Failed to load report data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const exportCSV = async (type) => {
    try {
      let data = [];
      if (type === 'visitors') {
        const res = await passAPI.getAll({ limit: 1000 });
        data = res.data.passes.map(p => ({
          PassCode: p.passCode,
          Visitor: p.visitor?.name,
          Email: p.visitor?.email,
          Host: p.host?.name,
          Purpose: p.purpose,
          Status: p.status,
          IssuedAt: new Date(p.createdAt).toLocaleString(),
        }));
      } else if (type === 'logs') {
        const res = await checkLogAPI.getAll({ limit: 1000 });
        data = res.data.logs.map(l => ({
          Action: l.action,
          Visitor: l.visitor?.name,
          PassCode: l.pass?.passCode,
          Time: new Date(l.timestamp).toLocaleString(),
          PerformedBy: l.performedBy?.name,
        }));
      }

      const headers = Object.keys(data[0] || {});
      const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const purposeData = [
    { name: 'Meeting', value: 40 },
    { name: 'Interview', value: 20 },
    { name: 'Vendor', value: 25 },
    { name: 'Other', value: 15 },
  ];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><h1>Reports & Analytics</h1><p>Overview of visitor activity and exportable data.</p></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => exportCSV('visitors')}><MdDownload /> Export Passes</button>
              <button className="btn btn-secondary" onClick={() => exportCSV('logs')}><MdDownload /> Export Logs</button>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        {stats && (
          <div className="grid-4" style={{ marginBottom: 28 }}>
            {[
              { label: 'Total Visitors', value: stats.totalVisitors, icon: <MdPeople />, color: '#3d7fff' },
              { label: "Today's Visitors", value: stats.todayVisitors, icon: <MdPeople />, color: '#00e5a0' },
              { label: 'Active Passes', value: stats.activePasses, icon: <MdBadge />, color: '#ffb830' },
              { label: 'Currently Inside', value: stats.checkedIn, icon: <MdBarChart />, color: '#ff4d6d' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
              </div>
            ))}
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: 28 }}>
          {/* Weekly bar chart */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 20 }}>Visitors This Week</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="visitors" fill="#00e5a0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Purpose pie chart */}
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 20 }}>Visit Purposes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={purposeData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {purposeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Export section */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Export Data</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Download visitor and log data as CSV files.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, padding: '16px', background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, marginBottom: 4 }}>Visitor Passes Report</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>All issued passes with visitor details, host, purpose, and status.</p>
              <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => exportCSV('visitors')}><MdDownload /> Download CSV</button>
            </div>
            <div style={{ flex: 1, padding: '16px', background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, marginBottom: 4 }}>Check-In/Out Logs Report</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>Complete audit trail of all check-in and check-out events.</p>
              <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => exportCSV('logs')}><MdDownload /> Download CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
