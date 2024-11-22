import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
const queryClient = new QueryClient();

// Create a wrapper component to handle header visibility
const AppContent = () => {
  const location = useLocation();
  
  // Define routes where layout should be hidden
  const noLayoutRoutes = [
    '/test/take',
    '/test/shared',
    '/test/completed',
    '/test/proctoring',
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ];

  // Check if current path starts with any of the noLayoutRoutes
  const shouldShowLayout = !noLayoutRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <div>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes with Layout */}
        <Route 
          path="/vendor/*" 
          element={
            <ProtectedRoute 
              element={<VendorDashboard />} 
              allowedRoles={['vendor', 'admin']} 
            />
          } 
        />
        {/* ... other protected routes */}
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        future={{
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
