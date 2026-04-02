import { useState, useEffect } from 'react';
import { checkLogAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdLogin, MdLogout, MdFilterList } from 'react-icons/md';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CheckLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await checkLogAPI.getAll({ action: actionFilter, date: dateFilter });
      setLogs(res.data.logs);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, dateFilter]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Check-In / Out Logs</h1>
          <p>Complete audit trail of all visitor check-ins and check-outs.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'check-in', 'check-out'].map(a => (
              <button key={a} onClick={() => setActionFilter(a)} className="btn" style={{
                padding: '7px 16px', fontSize: 13,
                background: actionFilter === a ? 'var(--accent)' : 'var(--surface-2)',
                color: actionFilter === a ? '#000' : 'var(--text-soft)',
                border: `1px solid ${actionFilter === a ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
              }}>
                {a === '' ? 'All' : a === 'check-in' ? '↓ Check-In' : '↑ Check-Out'}
              </button>
            ))}
          </div>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            style={{ width: 180 }} title="Filter by date" />
          {dateFilter && (
            <button className="btn btn-secondary" onClick={() => setDateFilter('')} style={{ padding: '7px 12px' }}>
              Clear Date
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Action</th><th>Visitor</th><th>Pass Code</th><th>Purpose</th><th>Time</th><th>Performed By</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No logs found</td></tr>
              ) : logs.map(log => (
                <tr key={log._id}>
                  <td>
                    <span className={`badge ${log.action === 'check-in' ? 'badge-green' : 'badge-blue'}`}>
                      {log.action === 'check-in' ? <><MdLogin /> Check-In</> : <><MdLogout /> Check-Out</>}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{log.visitor?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.visitor?.email}</div>
                  </td>
                  <td><code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 5 }}>{log.pass?.passCode}</code></td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{log.pass?.purpose || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {format(new Date(log.timestamp), 'dd MMM yyyy, hh:mm a')}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{log.performedBy?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CheckLogs;
