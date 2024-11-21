import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
  Assessment,
  PlayCircleOutline,
  People,
  Timeline,
  Mail,
  AttachMoney
} from '@mui/icons-material';

const DashboardStats = ({ stats = { overview: {}, performance: {} } }) => {
  const { overview = {} } = stats;

  const statCards = [
    {
      title: 'Total Tests',
      value: overview.totalTests || 0,
      icon: Assessment,
      color: '#4CAF50',
      trend: '+12%'
    },
    {
      title: 'Active Tests',
      value: overview.activeTests || 0,
      icon: PlayCircleOutline,
      color: '#2196F3',
      trend: '+5%'
    },
    {
      title: 'Total Candidates',
      value: overview.totalCandidates || 0,
      icon: People,
      color: '#9C27B0',
      trend: '+18%'
    },
    {
      title: 'Tests Taken',
      value: overview.testsTaken || 0,
      icon: Timeline,
      color: '#FF9800',
      trend: '+25%'
    },
    {
      title: 'Pending Invites',
      value: overview.pendingInvitations || 0,
      icon: Mail,
      color: '#F44336',
      trend: '-2%'
    },
    {
      title: 'Revenue',
      value: `$${overview.totalRevenue || 0}`,
      icon: AttachMoney,
      color: '#00C853',
      trend: '+15%'
    }
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Paper
            key={index}
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box
              sx={{
                bgcolor: `${stat.color}15`,
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon sx={{ fontSize: 32, color: stat.color }} />
            </Box>
            
            <Box>
              <Typography color="text.secondary" variant="body2">
                {stat.title}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, my: 0.5 }}>
                {stat.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: stat.trend.startsWith('+') ? 'success.main' : 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {stat.trend} from last month
              </Typography>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default DashboardStats; 