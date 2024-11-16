import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';

const Reports = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        {/* Add reports content here */}
      </Box>
    </Layout>
  );
};

export default Reports; 