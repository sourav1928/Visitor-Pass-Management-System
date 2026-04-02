import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { Link } from 'react-router-dom';
import { MdPersonAdd, MdCalendarMonth, MdCancel } from 'react-icons/md';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_BADGE = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
  cancelled: 'badge-red',
  completed: 'badge-blue',
};

const EmployeeAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentAPI.myAppointments();
      setAppointments(res.data.appointments);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch { toast.error('Failed to cancel'); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><h1>My Appointments</h1><p>Visitor appointments you have scheduled.</p></div>
            <Link to="/employee/invite" className="btn btn-primary"><MdPersonAdd /> Invite Visitor</Link>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : appointments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <MdCalendarMonth style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8 }}>No appointments yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Invite a visitor to get started.</p>
            <Link to="/employee/invite" className="btn btn-primary" style={{ display: 'inline-flex' }}><MdPersonAdd /> Invite Visitor</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map(a => (
              <div key={a._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 22, flexShrink: 0 }}>
                    <MdCalendarMonth />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{a.visitorName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{a.visitorEmail}</div>
                    <div style={{ fontSize: 13, marginTop: 3, color: 'var(--text-soft)' }}>
                      {format(new Date(a.date), 'dd MMM yyyy')} at {a.time} · <span style={{ textTransform: 'capitalize' }}>{a.purpose}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span className={`badge ${STATUS_BADGE[a.status]}`}>{a.status}</span>
                  {(a.status === 'pending' || a.status === 'approved') && (
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleCancel(a._id)}>
                      <MdCancel /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAppointments;
