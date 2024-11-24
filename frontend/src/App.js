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

// Import dashboard components
import UserDashboard from './components/dashboard/candidate/Dashboard';
import AdminDashboard from './components/dashboard/admin/Dashboard';

// Import vendor pages
import VendorDashboard from './components/vendor/Dashboard/Dashboard';
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
import Statistics from './components/vendor/Dashboard/Statistics';
import Reports from './components/vendor/Dashboard/Reports';
import AllTests from './components/vendor/Assessments/AllTests';
import Templates from './components/vendor/Assessments/Templates';
import QuestionBank from './components/vendor/Assessments/QuestionBank';
import Archive from './components/vendor/Assessments/Archive';
import ActiveCandidates from './components/vendor/Candidates/ActiveCandidates';
import CompletedCandidates from './components/vendor/Candidates/CompletedCandidates';
import PendingCandidates from './components/vendor/Candidates/PendingCandidates';
import TestAnalytics from './components/vendor/Analytics/TestAnalytics';
import CandidateAnalytics from './components/vendor/Analytics/CandidateAnalytics';
import PerformanceInsights from './components/vendor/Analytics/PerformanceInsights';
import CustomReports from './components/vendor/Analytics/CustomReports';
import UpcomingTests from './components/vendor/Schedule/UpcomingTests';
import PastTests from './components/vendor/Schedule/PastTests';
import CalendarView from './components/vendor/Schedule/CalendarView';
import Documentation from './components/vendor/Resources/Documentation';
import APIAccess from './components/vendor/Resources/APIAccess';
import Guides from './components/vendor/Resources/Guides';
import Support from './components/vendor/Resources/Support';
import Billing from './components/vendor/Payments/Billing';
import Invoices from './components/vendor/Payments/Invoices';
import Subscription from './components/vendor/Payments/Subscription';
import PaymentHistory from './components/vendor/Payments/PaymentHistory';
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
              element={
                <Routes>
                  <Route path="dashboard" element={<VendorDashboard />} />
                  <Route path="dashboard/statistics" element={<Statistics />} />
                  <Route path="dashboard/reports" element={<Reports />} />
                  <Route path="tests" element={<AllTests />} />
                  <Route path="tests/create" element={<CreateTest />} />
                  <Route path="tests/templates" element={<Templates />} />
                  <Route path="tests/questions" element={<QuestionBank />} />
                  <Route path="tests/archive" element={<Archive />} />
                  <Route path="analytics" element={<VendorAnalytics />} />
                  <Route path="candidates" element={<VendorCandidates />} />
                  <Route path="invitations" element={<VendorInvitations />} />
                  <Route path="profile" element={<VendorProfile />} />
                  <Route path="reports" element={<VendorReports />} />
                  <Route path="candidates/active" element={<ActiveCandidates />} />
                  <Route path="candidates/completed" element={<CompletedCandidates />} />
                  <Route path="candidates/pending" element={<PendingCandidates />} />
                  <Route path="analytics/tests" element={<TestAnalytics />} />
                  <Route path="analytics/candidates" element={<CandidateAnalytics />} />
                  <Route path="analytics/insights" element={<PerformanceInsights />} />
                  <Route path="analytics/reports" element={<CustomReports />} />
                  <Route path="schedule/upcoming" element={<UpcomingTests />} />
                  <Route path="schedule/past" element={<PastTests />} />
                  <Route path="schedule/calendar" element={<CalendarView />} />
                  <Route path="resources/docs" element={<Documentation />} />
                  <Route path="resources/api" element={<APIAccess />} />
                  <Route path="resources/guides" element={<Guides />} />
                  <Route path="resources/support" element={<Support />} />
                  <Route path="payments/billing" element={<Billing />} />
                  <Route path="payments/invoices" element={<Invoices />} />
                  <Route path="payments/subscription" element={<Subscription />} />
                  <Route path="payments/history" element={<PaymentHistory />} />
                </Routes>
              } 
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
