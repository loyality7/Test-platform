import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  CssBaseline, 
  Paper,
  Fade,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  TextField,
  Tabs,
  Tab,
  Badge,
  Chip,
  Divider
} from '@mui/material';
import { useQuery } from 'react-query';
import { getMethod } from '../../../helpers';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import TestDistribution from './TestDistribution';
import PerformanceMetrics from './PerformanceMetrics';
import Layout from '../../layout/Layout';
import { 
  MoreVert, 
  Download, 
  Refresh,
  CalendarToday,
  TrendingUp,
  Assessment,
  People,
  Notifications,
  FilterList
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { isAuthenticated, token, user } = useAuth();
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Enhanced query with filters
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['vendorDashboard', startDate, endDate, selectedFilters],
    async () => {
      if (!isAuthenticated || !token) throw new Error('Not authenticated');
      const response = await getMethod('vendor/dashboard', true, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        filters: selectedFilters
      });
      return response.data;
    },
    {
      retry: 1,
      enabled: isAuthenticated,
      refetchInterval: 300000 // Auto refresh every 5 minutes
    }
  );

  // Memoized performance trends
  const performanceTrends = useMemo(() => {
    if (!dashboardData?.performance?.trends) return [];
    return dashboardData.performance.trends.map(trend => ({
      ...trend,
      date: new Date(trend.date).toLocaleDateString(),
    }));
  }, [dashboardData?.performance?.trends]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
    setFilterAnchorEl(null);
  };

  const renderPerformanceTrends = () => (
    <Paper sx={{ p: 3, height: '400px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Performance Trends</Typography>
        <Chip
          icon={<TrendingUp />}
          label={`${dashboardData?.performance?.growthRate || 0}% Growth`}
          color="success"
          variant="outlined"
        />
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={performanceTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip />
          <Line type="monotone" dataKey="score" stroke={theme.palette.primary.main} />
          <Line type="monotone" dataKey="passRate" stroke={theme.palette.success.main} />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`);
    setAnchorEl(null);
  };

  const renderHeader = () => (
    <Box sx={{ 
      mb: 4, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 2
    }}>
      <Box>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: theme.palette.primary.main,
          mb: 1
        }}>
          Vendor Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.name || 'Vendor'}! 👋
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            type="date"
            size="small"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputProps={{
              startAdornment: <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
            }}
            sx={{ width: 180 }}
          />
          <TextField
            type="date"
            size="small"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputProps={{
              startAdornment: <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
            }}
            sx={{ width: 180 }}
          />
        </Box>

        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={() => refetch()} 
            color="primary"
            sx={{
              transition: 'transform 0.3s',
              '&:hover': { transform: 'rotate(180deg)' }
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              transition: 'transform 0.2s'
            }
          }}
        >
          Export
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            elevation: 3,
            sx: { mt: 1.5 }
          }}
        >
          <MenuItem onClick={() => handleExport('pdf')}>
            <Download sx={{ mr: 1, fontSize: 20 }} /> Export as PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport('excel')}>
            <Download sx={{ mr: 1, fontSize: 20 }} /> Export as Excel
          </MenuItem>
          <MenuItem onClick={() => handleExport('csv')}>
            <Download sx={{ mr: 1, fontSize: 20 }} /> Export as CSV
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Fade in={true}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Loading your dashboard...
            </Typography>
          </Box>
        </Fade>
      );
    }

    if (error) {
      return (
        <Fade in={true}>
          <Paper 
            sx={{ 
              p: 4, 
              bgcolor: 'error.light',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Dashboard
            </Typography>
            <Typography color="error.dark">
              {error.message}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => refetch()}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Fade>
      );
    }

    return (
      <Fade in={true}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DashboardStats stats={dashboardData} />
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
                borderRadius: 2
              }}
            >
              <PerformanceMetrics metrics={dashboardData?.performance} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
                borderRadius: 2
              }}
            >
              <TestDistribution distribution={dashboardData?.testDistribution} />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 3,
                background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
                borderRadius: 2
              }}
            >
              <RecentActivity activities={dashboardData?.recentActivity} />
            </Paper>
          </Grid>
        </Grid>
      </Fade>
    );
  };

  return (
    <>
      <CssBaseline />
      <Layout>
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: '#F5F7FA',
          minHeight: '100vh',
          p: 3
        }}>
          {renderHeader()}
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ mb: 3 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<Assessment />} 
              label="Overview" 
            />
            <Tab 
              icon={<TrendingUp />} 
              label="Performance" 
            />
            <Tab 
              icon={
                <Badge badgeContent={dashboardData?.recentActivity?.length || 0} color="error">
                  <People />
                </Badge>
              } 
              label="Candidates" 
            />
            <Tab 
              icon={<Notifications />} 
              label="Notifications" 
            />
          </Tabs>
          <Divider sx={{ mb: 3 }} />
          {renderContent()}
        </Box>
      </Layout>
    </>
  );
};

export default Dashboard;
