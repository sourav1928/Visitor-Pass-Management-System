import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { passAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdBadge, MdDownload, MdPerson, MdCalendarMonth, MdBusiness, MdRefresh } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MyPass = () => {
  const { user } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await passAPI.getAll({ limit: 10 });
      // Filter passes for this visitor
      const myPasses = (res.data.passes || []).filter(
        p => p.visitor?.email === user?.email || p.visitor?.userAccount === user?._id
      );
      setPasses(myPasses);
      if (myPasses.length > 0) setSelected(myPasses[0]);
    } catch {
      toast.error('Failed to load your passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPasses(); }, []);

  const downloadPDF = async (id, code) => {
    try {
      const res = await passAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `pass-${code}.pdf`;
      a.click();
      toast.success('PDF downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const statusColor = { active: '#00e5a0', 'checked-in': '#00e5a0', 'checked-out': '#3d7fff', expired: '#ff4d6d', revoked: '#ff4d6d' };
  const statusLabel = { active: '● Active', 'checked-in': '✓ Checked In', 'checked-out': '✓ Checked Out', expired: '✗ Expired', revoked: '✗ Revoked' };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>My Visitor Pass</h1>
              <p>Show this QR code at the security gate for entry.</p>
            </div>
            <button className="btn btn-secondary" onClick={fetchPasses}><MdRefresh /> Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>Loading your passes...</div>
        ) : passes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 420 }}>
            <MdBadge style={{ fontSize: 52, color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8 }}>No passes yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              You don't have any visitor passes. An employee needs to invite you, or security can issue a walk-in pass for you at the gate.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Pass list (if multiple) */}
            {passes.length > 1 && (
              <div style={{ width: 240 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Passes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {passes.map(p => (
                    <div
                      key={p._id}
                      onClick={() => setSelected(p)}
                      style={{
                        padding: '12px 14px',
                        background: selected?._id === p._id ? 'var(--accent-dim)' : 'var(--surface)',
                        border: `1px solid ${selected?._id === p._id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 9, cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent)' }}>{p.passCode}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{p.purpose}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{format(new Date(p.validFrom), 'dd MMM yyyy')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected pass card */}
            {selected && (
              <div style={{ flex: 1, minWidth: 300, maxWidth: 460 }}>
                <div style={{
                  background: 'var(--surface)',
                  border: `1px solid ${statusColor[selected.status] || 'var(--border)'}`,
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  {/* Header */}
                  <div style={{
                    background: `linear-gradient(135deg, ${statusColor[selected.status] || '#00e5a0'} 0%, ${statusColor[selected.status] || '#00c98a'}cc 100%)`,
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Visitor Pass</div>
                      <div style={{ color: '#000', fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 800, marginTop: 2 }}>
                        {selected.visitor?.company || 'VisitorPass'}
                      </div>
                    </div>
                    <span style={{ background: 'rgba(0,0,0,0.15)', color: '#000', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                      {statusLabel[selected.status] || selected.status}
                    </span>
                  </div>

                  <div style={{ padding: 24 }}>
                    {/* QR Code */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <div style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <QRCodeSVG value={`VPMS:${selected.passCode}`} size={160} bgColor="#ffffff" fgColor="#000000" level="M" />
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <code style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{selected.passCode}</code>
                    </div>

                    <div className="divider" />

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                      {[
                        { icon: <MdPerson />, label: 'Visitor', value: selected.visitor?.name || user?.name },
                        { icon: <MdBusiness />, label: 'Meeting with', value: selected.host?.name || '—' },
                        { icon: <MdBadge />, label: 'Purpose', value: selected.purpose },
                        { icon: <MdCalendarMonth />, label: 'Valid', value: `${format(new Date(selected.validFrom), 'dd MMM')} – ${format(new Date(selected.validUntil), 'dd MMM yyyy, hh:mm a')}` },
                      ].map(({ icon, label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>
                            {icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selected.floor && (
                      <div style={{ marginTop: 16, background: 'var(--accent-dim)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-soft)' }}>
                        📍 <strong>Report to:</strong> {selected.floor}{selected.room ? ` · ${selected.room}` : ''}
                      </div>
                    )}

                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                      onClick={() => downloadPDF(selected._id, selected.passCode)}
                    >
                      <MdDownload /> Download PDF Pass
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                  Valid only for the date and time shown. Carry a valid photo ID.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPass;
