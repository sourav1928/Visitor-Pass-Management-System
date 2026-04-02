import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdPeople, MdQrCode, MdCalendarMonth,
  MdAssignment, MdBarChart, MdLogout, MdSecurity,
  MdPersonAdd, MdBadge, MdHistory
} from 'react-icons/md';

const navConfig = {
  admin: [
    { label: 'Dashboard', icon: <MdDashboard />, to: '/admin' },
    { label: 'Users', icon: <MdPeople />, to: '/admin/users' },
    { label: 'Visitors', icon: <MdPersonAdd />, to: '/admin/visitors' },
    { label: 'Passes', icon: <MdBadge />, to: '/admin/passes' },
    { label: 'Appointments', icon: <MdCalendarMonth />, to: '/admin/appointments' },
    { label: 'Check Logs', icon: <MdHistory />, to: '/admin/logs' },
    { label: 'Reports', icon: <MdBarChart />, to: '/admin/reports' },
  ],
  security: [
    { label: 'Dashboard', icon: <MdDashboard />, to: '/security' },
    { label: 'Scan QR', icon: <MdQrCode />, to: '/security/scan' },
    { label: 'Issue Pass', icon: <MdBadge />, to: '/security/issue' },
    { label: 'Check Logs', icon: <MdHistory />, to: '/security/logs' },
  ],
  employee: [
    { label: 'Dashboard', icon: <MdDashboard />, to: '/employee' },
    { label: 'Invite Visitor', icon: <MdPersonAdd />, to: '/employee/invite' },
    { label: 'Appointments', icon: <MdCalendarMonth />, to: '/employee/appointments' },
  ],
  visitor: [
    { label: 'My Pass', icon: <MdBadge />, to: '/visitor' },
    { label: 'Pre-Register', icon: <MdAssignment />, to: '/visitor/register' },
  ],
};

const roleColors = {
  admin: '#3d7fff',
  security: '#ff4d6d',
  employee: '#00e5a0',
  visitor: '#ffb830',
};

const roleLabels = {
  admin: 'Administrator',
  security: 'Security',
  employee: 'Employee',
  visitor: 'Visitor',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navConfig[user?.role] || [];
  const color = roleColors[user?.role] || '#00e5a0';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: `${color}22`,
            border: `1.5px solid ${color}`,
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            <MdSecurity style={{ color }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
              VisitorPass
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Management System
            </div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color, fontWeight: 600 }}>{roleLabels[user?.role]}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to.split('/').length === 2}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 2,
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? color : 'var(--text-soft)',
              background: isActive ? `${color}15` : 'transparent',
              transition: 'all 0.15s',
              textDecoration: 'none',
            })}
          >
            <span style={{ fontSize: 18 }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', gap: 8 }}
        >
          <MdLogout /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
