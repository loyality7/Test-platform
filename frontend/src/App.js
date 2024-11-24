import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { QueryClient, QueryClientProvider } from 'react-query';

// Import pages
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/profile/profile';
import UserDashboardPage from './pages/dashboard/candidate/UserDashboard';
import VendorDashboardPage from './pages/dashboard/vendor/VendorDashboard';
import AdminDashboardPage from './pages/dashboard/admin/AdminDashboard';
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
import TestSubmissions from './pages/vendor/TestSubmissions';
const queryClient = new QueryClient();

// Create a wrapper component to handle header visibility
const AppContent = () => {
  const location = useLocation();
  
  // Define routes where header should be hidden
  const noHeaderRoutes = [
    '/test/take',
    // '/test/shared',
    '/test/completed',
    '/test/proctoring'
  ];

  // Check if current path starts with any of the noHeaderRoutes
  const shouldShowHeader = !noHeaderRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <>
      {shouldShowHeader && <Header />}
      <div className={shouldShowHeader ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route 
            path="/vendor/dashboard" 
            element={
              <ProtectedRoute 
                element={<VendorDashboardPage />} 
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
            path="/vendor/tests/create" 
            element={
              <ProtectedRoute 
                element={<CreateTest />} 
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
          <Route 
            path="/vendor/analytics/submissions/:testId" 
            element={
              <ProtectedRoute 
                element={<TestSubmissions />} 
                allowedRoles={['vendor', 'admin']} 
              />
            } 
          />
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
      <Router
        future={{
          v7_startTransition: true,
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
