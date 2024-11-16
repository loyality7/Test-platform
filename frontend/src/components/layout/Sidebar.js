import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Assignment as TestIcon,
  Analytics as AnalyticsIcon,
  People as CandidatesIcon,
  Email as InvitationsIcon,
  Person as ProfileIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', icon: <DashboardIcon />, path: '/vendor/dashboard' },
        { name: 'Tests', icon: <TestIcon />, path: '/vendor/tests' },
        { name: 'Analytics', icon: <AnalyticsIcon />, path: '/vendor/analytics' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Candidates', icon: <CandidatesIcon />, path: '/vendor/candidates' },
        { name: 'Invitations', icon: <InvitationsIcon />, path: '/vendor/invitations' },
      ]
    },
    {
      title: 'OTHERS',
      items: [
        { name: 'Profile', icon: <ProfileIcon />, path: '/vendor/profile' },
        { name: 'Reports', icon: <ReportsIcon />, path: '/vendor/reports' },
      ]
    }
  ];

  return (
    <Box
      sx={{
        width: 260,
        backgroundColor: '#f8f9fa',
        height: '100vh',
        borderRight: '1px solid #e0e0e0',
        padding: '20px 0',
      }}
    >
      {menuItems.map((section, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <Typography
            variant="subtitle2"
            sx={{
              px: 3,
              mb: 1,
              color: '#666',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {section.title}
          </Typography>
          <List>
            {section.items.map((item, idx) => (
              <ListItem
                key={idx}
                component={Link}
                to={item.path}
                sx={{
                  px: 3,
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
};

export default Sidebar; 