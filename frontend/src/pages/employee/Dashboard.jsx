import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MdPersonAdd, MdCalendarMonth, MdCheckCircle, MdPending, MdCancel, MdArrowForward } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_BADGE = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-red', completed: 'badge-blue' };

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, upcoming: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await appointmentAPI.myAppointments();
        const appts = res.data.appointments || [];
        setAppointments(appts.slice(0, 5));
        const now = new Date();
        setStats({
          total: appts.length,
          pending: appts.filter(a => a.status === 'pending').length,
          approved: appts.filter(a => a.status === 'approved').length,
          upcoming: appts.filter(a => new Date(a.date) > now && a.status === 'approved').length,
        });
      } catch { toast.error('Failed to load appointments'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
              <p>Manage your visitor invitations and appointments.</p>
            </div>
            <Link to="/employee/invite" className="btn btn-primary"><MdPersonAdd /> Invite Visitor</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Total Invites', value: stats.total, icon: <MdCalendarMonth />, color: '#3d7fff', bg: 'rgba(61,127,255,0.12)' },
            { label: 'Pending Approval', value: stats.pending, icon: <MdPending />, color: '#ffb830', bg: 'rgba(255,184,48,0.12)' },
            { label: 'Approved', value: stats.approved, icon: <MdCheckCircle />, color: '#00e5a0', bg: 'rgba(0,229,160,0.12)' },
            { label: 'Upcoming Visits', value: stats.upcoming, icon: <MdCalendarMonth />, color: '#9b8afb', bg: 'rgba(155,138,251,0.12)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-info"><h3>{loading ? '—' : s.value}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {[
            { label: 'Invite a Visitor', desc: 'Send a pre-registration invite to a guest', to: '/employee/invite', color: 'var(--accent)', icon: <MdPersonAdd /> },
            { label: 'View All Appointments', desc: 'See all your scheduled visitor appointments', to: '/employee/appointments', color: '#3d7fff', icon: <MdCalendarMonth /> },
          ].map(action => (
            <Link key={action.label} to={action.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = action.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color, fontSize: 26, flexShrink: 0 }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15 }}>{action.label}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{action.desc}</p>
                </div>
                <MdArrowForward style={{ color: 'var(--text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent appointments */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16 }}>Recent Appointments</h3>
            <Link to="/employee/appointments" style={{ fontSize: 13, color: 'var(--accent)' }}>View all →</Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : appointments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 36 }}>
              <MdCalendarMonth style={{ fontSize: 44, color: 'var(--text-muted)', marginBottom: 10 }} />
              <p style={{ color: 'var(--text-muted)' }}>No appointments yet. <Link to="/employee/invite" style={{ color: 'var(--accent)' }}>Invite your first visitor →</Link></p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Visitor</th><th>Purpose</th><th>Date & Time</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.visitorName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.visitorEmail}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{a.purpose}</td>
                      <td style={{ fontSize: 13 }}>
                        <div>{format(new Date(a.date), 'dd MMM yyyy')}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{a.time}</div>
                      </td>
                      <td><span className={`badge ${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
