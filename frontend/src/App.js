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
                element={<ProtectedRoute element={<UserDashboardPage />} allowedRoles={['user', 'vendor', 'admin']} />} 
              />
              <Route 
                path="/dashboard/vendor" 
                element={<ProtectedRoute element={<VendorDashboardPage />} allowedRoles={['vendor', 'admin']} />} 
              />
              <Route 
                path="/dashboard/admin" 
                element={<ProtectedRoute element={<AdminDashboardPage />} allowedRoles={['admin']} />} 
              />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
