import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: 3,
          width: '100%',
          overflow: 'auto'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 