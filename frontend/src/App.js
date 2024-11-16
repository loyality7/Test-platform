import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Header />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/profile" 
                element={<ProtectedRoute element={<Profile />} allowedRoles={['user', 'vendor', 'admin']} />} 
              />
              <Route 
                path="/dashboard/user" 
                element={<ProtectedRoute element={<UserDashboardPage />} allowedRoles={['user', 'admin']} />} 
              />
              <Route 
                path="/dashboard/vendor" 
                element={<ProtectedRoute element={<VendorDashboardPage />} allowedRoles={['vendor', 'admin']} />} 
              />
              <Route 
                path="/dashboard/admin" 
                element={<ProtectedRoute element={<AdminDashboardPage />} allowedRoles={['admin']} />} 
              />
              <Route path="/vendor/dashboard" element={<Dashboard />} />
              <Route 
                path="/vendor/dashboard" 
                element={
                  <ProtectedRoute 
                    element={<VendorDashboard />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
              <Route 
                path="/vendor/tests" 
                element={
                  <ProtectedRoute 
                    element={<VendorTests />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
              <Route 
                path="/vendor/analytics" 
                element={
                  <ProtectedRoute 
                    element={<VendorAnalytics />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
              <Route 
                path="/vendor/candidates" 
                element={
                  <ProtectedRoute 
                    element={<VendorCandidates />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
              <Route 
                path="/vendor/invitations" 
                element={
                  <ProtectedRoute 
                    element={<VendorInvitations />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
              <Route 
                path="/vendor/profile" 
                element={
                  <ProtectedRoute 
                    element={<VendorProfile />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
              <Route 
                path="/vendor/reports" 
                element={
                  <ProtectedRoute 
                    element={<VendorReports />} 
                    allowedRoles={['vendor', 'admin']} 
                  />
                } 
              />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
