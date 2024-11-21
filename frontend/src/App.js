import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from 'react-query';

// Import pages
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/register';
import ForgotPassword from './pages/auth/forgot-password';  
import ResetPassword from './pages/auth/reset-password';
import Profile from './pages/profile/profile';
import UserDashboardPage from './pages/dashboard/candidate/UserDashboard';
import VendorDashboardPage from './pages/dashboard/vendor/VendorDashboard';
import AdminDashboardPage from './pages/dashboard/admin/AdminDashboard';
import Dashboard from './components/dashboard/vendor/Dashboard';

// Import vendor pages
import VendorDashboard from './components/dashboard/vendor/Dashboard';
import VendorTests from './pages/vendor/Tests';
import VendorAnalytics from './pages/vendor/Analytics';
import VendorCandidates from './pages/vendor/Candidates';
import VendorInvitations from './pages/vendor/Invitations';
import VendorProfile from './pages/vendor/Profile';
import VendorReports from './pages/vendor/Reports';
import CreateTest from './components/test/CreateTest';
import SharedTest from './pages/test/SharedTest';
import TakeTest from './pages/test/TakeTest';
import TestCompleted from './pages/test/TestCompleted';
import Proctoring from './pages/test/Proctoring';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Create a wrapper component to handle header visibility
const AppContent = () => {
  const location = useLocation();
  const noHeaderRoutes = ['/test/take', '/test/shared', '/test/completed', '/test/proctoring'];
  const shouldShowHeader = !noHeaderRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      {shouldShowHeader && <Header />}
      <div className={shouldShowHeader ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={
            <ProtectedRoute element={<Profile />} allowedRoles={['user', 'vendor', 'admin']} />
          } />
          <Route path="/dashboard/user" element={
            <ProtectedRoute element={<UserDashboardPage />} allowedRoles={['user', 'admin']} />
          } />
          <Route path="/dashboard/vendor" element={
            <ProtectedRoute element={<VendorDashboardPage />} allowedRoles={['vendor', 'admin']} />
          } />
          <Route path="/dashboard/admin" element={
            <ProtectedRoute element={<AdminDashboardPage />} allowedRoles={['admin']} />
          } />
          <Route path="/vendor/*" element={
            <ProtectedRoute element={
              <Routes>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="tests" element={<VendorTests />} />
                <Route path="tests/create" element={<CreateTest />} />
                <Route path="analytics" element={<VendorAnalytics />} />
                <Route path="candidates" element={<VendorCandidates />} />
                <Route path="invitations" element={<VendorInvitations />} />
                <Route path="profile" element={<VendorProfile />} />
                <Route path="reports" element={<VendorReports />} />
              </Routes>
            } allowedRoles={['vendor', 'admin']} />
          } />
          <Route path="/test/shared/:uuid" element={<SharedTest />} />
          <Route path="/test/take/:uuid" element={<TakeTest />} />
          <Route path="/test/completed" element={<TestCompleted />} />
          <Route path="/test/proctoring/:testId" element={<Proctoring />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
