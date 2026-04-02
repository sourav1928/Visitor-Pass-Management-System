import { useState, useEffect } from 'react';
import { passAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdSearch, MdDownload, MdQrCode } from 'react-icons/md';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_BADGE = {
  active: 'badge-green',
  'checked-in': 'badge-blue',
  'checked-out': 'badge-yellow',
  expired: 'badge-red',
  revoked: 'badge-red',
};

const AllPasses = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const res = await passAPI.getAll({ status: statusFilter });
      setPasses(res.data.passes);
    } catch { toast.error('Failed to load passes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPasses(); }, [statusFilter]);

  const downloadPDF = async (id, passCode) => {
    try {
      const res = await passAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `pass-${passCode}.pdf`;
      a.click();
    } catch { toast.error('PDF download failed'); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Visitor Passes</h1>
          <p>All issued visitor passes and their current status.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['', 'active', 'checked-in', 'checked-out', 'expired'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className="btn" style={{
              padding: '7px 16px', fontSize: 13,
              background: statusFilter === s ? 'var(--accent)' : 'var(--surface-2)',
              color: statusFilter === s ? '#000' : 'var(--text-soft)',
              border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
            }}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Pass Code</th><th>Visitor</th><th>Host</th><th>Purpose</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading...</td></tr>
              ) : passes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No passes found</td></tr>
              ) : passes.map(p => (
                <tr key={p._id}>
                  <td><code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 5 }}>{p.passCode}</code></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.visitor?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.visitor?.company}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.host?.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.purpose}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(p.validUntil), 'dd MMM yyyy HH:mm')}</td>
                  <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => downloadPDF(p._id, p.passCode)}>
                      <MdDownload /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllPasses;
