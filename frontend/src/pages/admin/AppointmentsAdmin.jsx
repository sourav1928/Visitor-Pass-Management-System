import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdSearch, MdCheckCircle, MdCancel, MdCalendarMonth, MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_BADGE = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-red',
  completed: 'badge-blue',
};

const AppointmentsAdmin = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentAPI.getAll({ status: statusFilter });
      setAppointments(res.data.appointments);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [statusFilter]);

  const handleApprove = async (id) => {
    setActionLoading(id + 'approve');
    try {
      await appointmentAPI.approve(id);
      toast.success('Appointment approved');
      fetchAppointments();
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(''); }
  };

  const handleReject = async (id) => {
    setActionLoading(id + 'reject');
    try {
      await appointmentAPI.reject(id);
      toast.success('Appointment rejected');
      fetchAppointments();
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(''); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Appointments</h1>
          <p>Review and approve visitor appointment requests.</p>
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="btn"
              style={{
                padding: '7px 16px', fontSize: 13,
                background: statusFilter === s ? 'var(--accent)' : 'var(--surface-2)',
                color: statusFilter === s ? '#000' : 'var(--text-soft)',
                border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
              }}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Visitor</th><th>Host</th><th>Purpose</th><th>Date & Time</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Loading...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No appointments found</td></tr>
              ) : appointments.map(a => (
                <tr key={a._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.visitorName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.visitorEmail}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{a.host?.name || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.purpose}</td>
                  <td style={{ fontSize: 13 }}>
                    <div>{format(new Date(a.date), 'dd MMM yyyy')}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{a.time}</div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setSelected(a)}>View</button>
                      {a.status === 'pending' && (<>
                        <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleApprove(a._id)} disabled={!!actionLoading}>✓</button>
                        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleReject(a._id)} disabled={!!actionLoading}>✗</button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Appointment Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 22 }}><MdClose /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Visitor Name', value: selected.visitorName },
                { label: 'Visitor Email', value: selected.visitorEmail },
                { label: 'Visitor Phone', value: selected.visitorPhone || '—' },
                { label: 'Host', value: selected.host?.name },
                { label: 'Purpose', value: selected.purpose },
                { label: 'Date', value: format(new Date(selected.date), 'dd MMMM yyyy') },
                { label: 'Time', value: selected.time },
                { label: 'Notes', value: selected.notes || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
                  <span style={{ fontWeight: 500, fontSize: 14, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelected(null)}>Close</button>
              {selected.status === 'pending' && (<>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleReject(selected._id)} disabled={!!actionLoading}>
                  <MdCancel /> Reject
                </button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleApprove(selected._id)} disabled={!!actionLoading}>
                  <MdCheckCircle /> Approve
                </button>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsAdmin;
