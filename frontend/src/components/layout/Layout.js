import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: '260px', // Same as sidebar width
          minHeight: '100vh',
          backgroundColor: '#f5f7fa',
        }}
      >
        <Header />
        <Box component="main" sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 