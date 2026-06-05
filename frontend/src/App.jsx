import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { dashboardPath } from './utils/roles';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Onboarding from './pages/Onboarding';
import EmployeeDashboard from './pages/EmployeeDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SeniorManagerDashboard from './pages/SeniorManagerDashboard';
import VideoInterview from './pages/VideoInterview';
import CandidateDashboard from './pages/CandidateDashboard';
import AccessDenied from './pages/AccessDenied';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  return <Navigate to={dashboardPath(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/candidate" element={<Navigate to="/dashboard/candidate" replace />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute roles={['employee']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/candidate"
            element={
              <ProtectedRoute roles={['applicant']}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employee"
            element={
              <ProtectedRoute roles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter"
            element={
              <ProtectedRoute roles={['hr_recruiter']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/manager"
            element={
              <ProtectedRoute roles={['senior_manager']}>
                <SeniorManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:appId"
            element={
              <ProtectedRoute roles={['applicant']}>
                <VideoInterview />
              </ProtectedRoute>
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/employee" element={<Navigate to="/dashboard/employee" replace />} />
          <Route path="/recruiter" element={<Navigate to="/dashboard/recruiter" replace />} />
          <Route path="/manager" element={<Navigate to="/dashboard/manager" replace />} />
          <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
