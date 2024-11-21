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
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
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
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        },
        zIndex: 1200,
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
            {section.items.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  key={idx}
                  component={Link}
                  to={item.path}
                  sx={{
                    px: 3,
                    py: 1,
                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'rgba(25, 118, 210, 0.12)' 
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                    color: isActive ? 'primary.main' : 'inherit',
                    textDecoration: 'none',
                    borderRight: isActive ? '3px solid' : 'none',
                    borderColor: 'primary.main',
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 40, 
                      color: isActive ? 'primary.main' : 'inherit' 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
};

export default Sidebar; 