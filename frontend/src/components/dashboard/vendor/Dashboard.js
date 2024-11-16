import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import { getMethod } from '../../../helpers';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import TestDistribution from './TestDistribution';
import PerformanceMetrics from './PerformanceMetrics';

const Dashboard = () => {
  const auth = useAuth();

  const { isAuthenticated, token } = auth;

  const { data: dashboardData, isLoading, error } = useQuery(
    'vendorDashboard',
    async () => {
      if (!isAuthenticated || !token) {
        throw new Error('Not authenticated');
      }
      
      const response = await getMethod('vendor/dashboard', true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard response:', response);
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dashboard data');
      }
      
      return {
        overview: {
          totalTests: 0,
          activeTests: 0,
          totalCandidates: 0,
          pendingInvitations: 0,
          ...response.data?.overview
        },
        performance: {
          averageScore: 0,
          passRate: 0,
          totalAttempts: 0,
          ...response.data?.performance
        },
        testDistribution: response.data?.testDistribution || {},
        recentActivity: response.data?.recentActivity || []
      };
    },
    {
      retry: 1,
      enabled: isAuthenticated,
      onError: (error) => {
        console.error('Dashboard fetch error:', error);
      }
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          Error loading dashboard: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Vendor Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12}>
          <DashboardStats stats={dashboardData.overview} />
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={8}>
          <PerformanceMetrics metrics={dashboardData.performance} />
        </Grid>

        {/* Test Distribution */}
        <Grid item xs={12} md={4}>
          <TestDistribution distribution={dashboardData.testDistribution} />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <RecentActivity activities={dashboardData.recentActivity} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
