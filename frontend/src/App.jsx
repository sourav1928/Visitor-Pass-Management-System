import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Public
import Login from './pages/Login';
import Register from './pages/Register';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AllVisitors from './pages/admin/AllVisitors';
import AllPasses from './pages/admin/AllPasses';
import AppointmentsAdmin from './pages/admin/AppointmentsAdmin';
import CheckLogs from './pages/admin/CheckLogs';
import Reports from './pages/admin/Reports';

// Security
import SecurityDashboard from './pages/security/Dashboard';
import ScanQR from './pages/security/ScanQR';
import IssuePass from './pages/security/IssuePass';

// Employee
import EmployeeDashboard from './pages/employee/Dashboard';
import InviteVisitor from './pages/employee/InviteVisitor';
import EmployeeAppointments from './pages/employee/Appointments';

// Visitor
import MyPass from './pages/visitor/MyPass';
import PreRegister from './pages/visitor/PreRegister';

const RoleRedirect = () => {
  const { user } = useAuth();
  const map = { admin: '/admin', security: '/security', employee: '/employee', visitor: '/visitor' };
  return <Navigate to={map[user?.role] || '/login'} replace />;
};

const toastStyle = {
  style: {
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontSize: '14px',
  },
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={toastStyle} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pre-register/:token" element={<PreRegister />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/visitors" element={<ProtectedRoute roles={['admin']}><AllVisitors /></ProtectedRoute>} />
          <Route path="/admin/passes" element={<ProtectedRoute roles={['admin']}><AllPasses /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute roles={['admin']}><AppointmentsAdmin /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute roles={['admin']}><CheckLogs /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />

          {/* Security */}
          <Route path="/security" element={<ProtectedRoute roles={['security', 'admin']}><SecurityDashboard /></ProtectedRoute>} />
          <Route path="/security/scan" element={<ProtectedRoute roles={['security', 'admin']}><ScanQR /></ProtectedRoute>} />
          <Route path="/security/issue" element={<ProtectedRoute roles={['security', 'admin']}><IssuePass /></ProtectedRoute>} />
          <Route path="/security/logs" element={<ProtectedRoute roles={['security', 'admin']}><CheckLogs /></ProtectedRoute>} />

          {/* Employee */}
          <Route path="/employee" element={<ProtectedRoute roles={['employee', 'admin']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/invite" element={<ProtectedRoute roles={['employee', 'admin']}><InviteVisitor /></ProtectedRoute>} />
          <Route path="/employee/appointments" element={<ProtectedRoute roles={['employee', 'admin']}><EmployeeAppointments /></ProtectedRoute>} />

          {/* Visitor */}
          <Route path="/visitor" element={<ProtectedRoute roles={['visitor', 'admin']}><MyPass /></ProtectedRoute>} />
          <Route path="/visitor/register" element={<ProtectedRoute roles={['visitor', 'admin']}><PreRegister /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
