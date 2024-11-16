import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';

const Analytics = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        {/* Add analytics content here */}
      </Box>
    </Layout>
  );
};

export default Analytics; 