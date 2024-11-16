import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';

const Candidates = () => {
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Candidates Management
        </Typography>
        {/* Add candidates management content here */}
      </Box>
    </Layout>
  );
};

export default Candidates; 